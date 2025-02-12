import { Request, Response } from "express";
import Ticket from "../models/TicketModel";
import Message from "../models/MessageModel";
import LogService from "../services/LogService";
import { IDiscordField } from "../../interfaces/Discord";
import DiscordService from "../services/DiscordService";
import webhookColors from "../constants/webhookColors";
import config from "../../config.json";
import helpers from "../helpers";

class TicketsController {
    /** GET ticket listing */
    public async index(req: Request, res: Response) {
        //TODO: remake this
        const user = res.locals!.user!;
        const query: any = {};

        // Non-committee users can only see:
        // - Their own tickets/reports
        // - Tickets assigned to their committee
        if (!user.isCommittee) {
            query.$or = [{ author: user._id }, { type: "ticket" }];
        }

        const tickets = await Ticket.find(query).populate("author messages targetUser").sort({ updatedAt: -1 });

        res.json(tickets);
    }

    /** POST create ticket */
    public async create(req: Request, res: Response) {
        const author = res.locals!.user!;
        const { title, message, type, assignedGroup, targetUserId, targetTournamentName, targetTournamentForumUrl } =
            req.body;

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
            targetTournamentName,
            targetTournamentForumUrl,
            isActive: true,
        });

        if (targetUserId) {
            targetUser = await User.findById(targetUserId).orFail();
            ticket.targetUser = targetUser;
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
                    value: `[**${targetTournamentName}**](${targetTournamentForumUrl})`,
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
}

export default new TicketsController();
