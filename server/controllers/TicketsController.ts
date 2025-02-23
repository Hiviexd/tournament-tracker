import { Request, Response } from "express";
import Ticket from "../models/ticketModel";
import Message from "../models/messageModel";
import User from "../models/userModel";
import { IUser } from "../../interfaces/User";
import LogService from "../services/LogService";
import { IDiscordField } from "../../interfaces/Discord";
import DiscordService from "../services/DiscordService";
import webhookColors from "../constants/webhookColors";
import config from "../../config.json";
import helpers from "../helpers";
import TicketService from "../services/TicketService";
import _ from "lodash";
import UploadService from "../services/UploadService";

const DEFAULT_POPULATE = [
    { path: "author", select: "username osuId groups" },
    {
        path: "messages",
        populate: [
            {
                path: "author",
                select: "username osuId groups",
            },
            { path: "attachments", select: "originalName url size type" },
        ],
    },
    { path: "targetUser", select: "username osuId groups coverUrl" },
];
const DEFAULT_LIMIT = 12;

const FILE_UPLOAD_CATEGORY = "tickets";

class TicketsController {
    /** GET ticket listing */
    public async index(req: Request, res: Response) {
        const { type, title, targetUser, targetTournament, assignedGroup, isActive, showOwn, page = 1 } = req.query;

        const query: any = {};
        const user = res.locals!.user!;

        if (type) query.type = type;
        if (type === "ticket" && title) {
            query.title = new RegExp(title as string, "i");
        }
        if (type === "report") {
            if (targetUser) {
                const user = await User.findByUsernameOrOsuId(targetUser as string);
                if (user) query.targetUser = user._id;
            }
            if (targetTournament) {
                query.targetTournamentName = new RegExp(targetTournament as string, "i");
            }
        }
        if (assignedGroup) query.assignedGroup = assignedGroup;
        if (showOwn === "true") query.author = user._id;
        if (isActive !== undefined) query.isActive = isActive === "true";

        if (!user.isCommittee) {
            query.$or = [{ author: user._id }, { type: "ticket" }];
        }

        const skip = (Number(page) - 1) * DEFAULT_LIMIT;

        const [tickets, total] = await Promise.all([
            Ticket.find(query).sort({ updatedAt: -1 }).skip(skip).limit(DEFAULT_LIMIT).populate(DEFAULT_POPULATE),
            Ticket.countDocuments(query),
        ]);

        tickets.forEach((ticket) => TicketService.sanitizeTicket(ticket, user));

        res.json({
            tickets,
            total,
            page: Number(page),
            pages: Math.ceil(total / DEFAULT_LIMIT),
        });
    }

    /** GET ticket */
    public async getTicket(req: Request, res: Response) {
        const user = res.locals!.user!;
        const ticket = await Ticket.findById(req.params.ticketId).populate(DEFAULT_POPULATE).orFail();

        if (!ticket.isTicket && !user.isCommittee && !ticket.author.equals(user._id)) {
            return res.json({ error: "Not authorized to view this ticket" });
        }

        const sanitizedTicket = TicketService.sanitizeTicket(ticket, user);
        res.json(sanitizedTicket);
    }

    /** POST create ticket */
    public async create(req: Request, res: Response) {
        const author = res.locals!.user!;
        const { title, message, type, assignedGroup, targetUserId, targetTournamentName, targetTournamentLink } =
            req.body;
        const files = req.files as Express.Multer.File[];

        let targetUser: IUser;

        if (type === "ticket" && (title.length < 5 || title.length > 80))
            return res.json({ error: "Title must be between 5 and 80 characters" });

        if (message.length < 10 || message.length > 6000)
            return res.json({ error: "Message must be between 10 and 6000 characters" });

        // construct report title
        let constructedTitle: string = title ? title.trim() : "";

        if (type === "report") {
            const count = await Ticket.countDocuments({ type: "report" });
            const reportType = targetUserId ? "User" : "Tournament";
            constructedTitle = `${reportType} Report #${count + 1}`;
        }

        const ticket = new Ticket({
            title: constructedTitle,
            type,
            author,
            assignedGroup,
            isActive: true,
        });

        if (type === "report") {
            if (targetUserId) {
                targetUser = await User.findById(targetUserId).orFail();
                ticket.targetUser = targetUser;
            } else {
                if (targetTournamentName.length < 5 || targetTournamentName.length > 120)
                    return res.json({ error: "Tournament name must be between 5 and 120 characters" });

                if (!helpers.isOsuForumLink(targetTournamentLink))
                    return res.json({ error: "Invalid tournament forum link" });

                ticket.targetTournamentName = targetTournamentName.trim();
                ticket.targetTournamentLink = targetTournamentLink.trim();
            }
        }

        const initialMessage = new Message({
            author,
            content: message.trim(),
            isCommittee: false,
            attachments: [],
        });

        // Handle file uploads
        initialMessage.attachments = await UploadService.handleFileUploads(
            files,
            FILE_UPLOAD_CATEGORY,
            ticket._id,
            author._id
        );

        await initialMessage.save();
        ticket.messages.push(initialMessage._id);
        await ticket.save();

        // Logger
        await LogService.generate(
            author._id,
            `Created a new ${type}: [**${ticket.title}**](${config.discord.baseUrl}/tickets/${ticket._id})`,
            "ticket"
        );

        // Discord webhook
        const roles: string[] = [];

        if (ticket.assignedGroup === "tc") roles.push("tournament");
        if (ticket.assignedGroup === "cc") roles.push("contest");

        const fields: IDiscordField[] = [];

        if (type === "report") {
            if (targetUserId) {
                fields.push({
                    name: "Target User",
                    value: `[**${ticket.targetUser?.username}**](https://osu.ppy.sh/users/${ticket.targetUser?.osuId})`,
                });
            } else {
                fields.push({
                    name: "Target Tournament",
                    value: `[**${targetTournamentName}**](${targetTournamentLink})`,
                });
            }
        }

        fields.push({ name: "Message", value: helpers.shorten(message, 512) });

        const embedTitle = type === "report" ? `New ${ticket.title}` : `New Ticket: ${ticket.title}`;

        await DiscordService.sendRoleHighlightWebhook(roles, [
            {
                author: DiscordService.defaultWebhookAuthor(req.session),
                color: type === "report" ? webhookColors.lightRed : webhookColors.blue,
                title: embedTitle,
                url: `${config.discord.baseUrl}/tickets/${ticket._id}`,
                fields,
            },
        ]);

        res.json({ message: `${_.capitalize(type)} created successfully!`, ticket });
    }

    /** POST send message in ticket */
    public async sendMessage(req: Request, res: Response) {
        const user = res.locals!.user!;
        const { ticketId } = req.params;
        const { content } = req.body;
        const isNote = req.body.isNote === "true" || req.body.isNote === false;
        const files = req.files as Express.Multer.File[];

        const ticket = await Ticket.findById(ticketId).populate(DEFAULT_POPULATE).orFail();
        const isTicketAuthor = ticket.author.id === user.id;

        // Authorization checks
        if (!user.isCommittee && !isTicketAuthor) {
            return res.json({ error: "Not authorized to message this ticket" });
        }

        if (isNote && !user.isCommittee) {
            return res.json({ error: "Not authorized to add notes" });
        }

        if (content.length < 10 || content.length > 6000) {
            return res.json({ error: "Message must be between 10 and 6000 characters" });
        }

        const message = new Message({
            author: user._id,
            content,
            isCommittee: isTicketAuthor ? false : user.isCommittee,
            isNote,
            attachments: [],
        });

        // Handle file uploads
        message.attachments = await UploadService.handleFileUploads(files, FILE_UPLOAD_CATEGORY, ticket._id, user._id);

        await message.save();
        ticket.messages.push(message._id);
        await ticket.save();

        // Logger
        await LogService.generate(
            user._id,
            `Sent a message in ${ticket.type}: [**${ticket.title}**](${config.discord.baseUrl}/tickets/${ticket._id})`,
            "ticket"
        );

        // Discord
        await DiscordService.sendWebhook([
            {
                author: DiscordService.defaultWebhookAuthor(req.session),
                color: isNote ? webhookColors.lightBlue : webhookColors.darkBlue,
                description: `${isNote ? "Added a note" : "Sent a message"} in ${ticket.type}: [**${ticket.title}**](${
                    config.discord.baseUrl
                }/tickets/${ticket._id})`,
                fields: [{ name: isNote ? "Note" : "Message", value: helpers.shorten(content, 512) }],
            },
        ]);

        res.json({ message: "Message sent successfully!" });
    }

    /** POST close or reopen ticket */
    public async toggleStatus(req: Request, res: Response) {
        const user = res.locals!.user!;
        const ticket = await Ticket.findById(req.params.ticketId).orFail();

        ticket.isActive = !ticket.isActive;
        await ticket.save();

        res.json({
            message: `${_.capitalize(ticket.type)} ${ticket.isActive ? "reopened" : "closed"} successfully!`,
            ticket,
        });

        // Logger
        await LogService.generate(
            user._id,
            `${ticket.isActive ? "Reopened" : "Closed"} ${ticket.type}: [**${ticket.title}**](${
                config.discord.baseUrl
            }/tickets/${ticket._id})`,
            "ticket"
        );

        // Discord
        await DiscordService.sendWebhook([
            {
                author: DiscordService.defaultWebhookAuthor(req.session),
                color: ticket.isActive ? webhookColors.lightPurple : webhookColors.darkPurple,
                description: `${ticket.isActive ? "Reopened" : "Closed"} ${ticket.type}: [**${ticket.title}**](${
                    config.discord.baseUrl
                }/tickets/${ticket._id})`,
            },
        ]);
    }
}

export default new TicketsController();
