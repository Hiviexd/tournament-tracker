import { Request, Response } from "express";
import Ticket from "../models/dickwang";
import Message from "../models/messageModel";
import User from "../models/userModel";
import { IUser } from "../../interfaces/User";
import LogService from "../services/LogService";
import { IDiscordField } from "../../interfaces/Discord";
import DiscordService from "../services/DiscordService";
import webhookColors from "../constants/webhookColors";
import config from "../../config.json";
import helpers from "../helpers";

const DEFAULT_POPULATE = [
    { path: "author", select: "username osuId groups" },
    {
        path: "messages",
        populate: {
            path: "author",
            select: "username osuId groups",
        },
    },
    { path: "targetUser", select: "username osuId groups" },
];
const DEFAULT_LIMIT = 12;

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

        res.json({
            tickets,
            total,
            page: Number(page),
            pages: Math.ceil(total / DEFAULT_LIMIT),
        });
    }

    /** GET ticket */
    public async getTicket(req: Request, res: Response) {
        const ticket = await Ticket.findById(req.params.ticketId).populate(DEFAULT_POPULATE).orFail();
        res.json(ticket);
    }

    /** POST create ticket */
    public async create(req: Request, res: Response) {
        const author = res.locals!.user!;
        const { title, message, type, assignedGroup, targetUserId, targetTournamentName, targetTournamentLink } =
            req.body;

        let targetUser: IUser;

        // construct report title
        let constructedTitle: string = title;

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
                ticket.targetTournamentName = targetTournamentName;
                ticket.targetTournamentLink = targetTournamentLink;
            }
        }

        const initialMessage = new Message({
            author,
            content: message,
            isCommittee: false,
        });

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

        res.json({ message: `${type} created successfully!`, ticket });
    }

    /** POST send message in ticket */
    public async sendMessage(req: Request, res: Response) {
        const user = res.locals!.user!;
        const { ticketId } = req.params;
        const { content, isNote } = req.body;

        const ticket = await Ticket.findById(ticketId).populate("author").orFail();
        const isTicketAuthor = ticket.author.id === user.id;

        if (!user.isCommittee && !isTicketAuthor) {
            return res.json({ error: "Not authorized to message this ticket" });
        }

        const message = new Message({
            author: user._id,
            content,
            isCommittee: isTicketAuthor ? false : user.isCommittee,
        });

        // auth for notes
        if (isNote && !user.isCommittee) {
            return res.json({ error: "Not authorized to add notes" });
        }

        message.isNote = isNote;

        await message.save();

        ticket.messages.push(message._id);
        await ticket.save();

        // Log the action
        await LogService.generate(
            user._id,
            `Added message to ticket: [**${ticket.title}**](${config.discord.baseUrl}/tickets/${ticket._id})`,
            "ticket"
        );

        // Send Discord webhook notification
        await DiscordService.sendRoleHighlightWebhook(ticket.assignedGroup === "tc" ? ["tournament"] : ["contest"], [
            {
                author: DiscordService.defaultWebhookAuthor(req.session),
                color: ticket.type === "report" ? webhookColors.lightRed : webhookColors.blue,
                title: `New message in ${ticket.type}: ${ticket.title}`,
                url: `${config.discord.baseUrl}/tickets/${ticket._id}`,
                fields: [{ name: "Message", value: helpers.shorten(content, 512) }],
            },
        ]);

        // Return populated message
        const populatedMessage = await Message.findById(message._id).populate("author", "username osuId groups");
        res.json(populatedMessage);
    }
}

export default new TicketsController();

// ! IMPORTANT TODO: SECURITY (extra checks for population)
