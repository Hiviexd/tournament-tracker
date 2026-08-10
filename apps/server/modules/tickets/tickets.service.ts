import {
    BadRequestException,
    ForbiddenException,
    HttpException,
    HttpStatus,
    Inject,
    Injectable,
} from "@nestjs/common";
import type { Session } from "express-session";
import type { Model } from "mongoose";
import Message from "@tc/models/messageModel";
import type { ITicket } from "@tc/types/Ticket";
import type { IUser, IUserStatics } from "@tc/types/User";
import LogService from "@tc/models/LogService";
import { EmbedBuilder } from "@tc/notifications/discord/EmbedBuilder";
import { WebhookBuilder } from "@tc/notifications/discord/WebhookBuilder";
import DiscordUtils from "@tc/notifications/discord/DiscordUtils";
import config from "@tc/config";
import utils from "@tc/utils/server";
import { TicketDomainService } from "../../services/TicketDomainService";
import capitalize from "lodash/capitalize.js";
import { UploadService } from "../../services/UploadService";
import NotificationDispatchService from "@tc/notifications/NotificationDispatchService";
import { TICKET_MODEL, USER_MODEL } from "../common/database.tokens";

const DEFAULT_POPULATE = [
    { path: "author", select: "username osuId groups coverUrl country" },
    {
        path: "messages",
        populate: [
            {
                path: "author",
                select: "username osuId groups discordId coverUrl country",
            },
            { path: "attachments", select: "originalName url size type" },
        ],
    },
    { path: "targetUser", select: "username osuId groups coverUrl country" },
];
const DEFAULT_LIMIT = 12;

const FILE_UPLOAD_CATEGORY = "tickets";

const PIF_REPORT_COUNT_OFFSET = 17; // DO NOT CHANGE THIS

@Injectable()
export class TicketsService {
    constructor(
        @Inject(TICKET_MODEL) private readonly ticketModel: Model<ITicket>,
        @Inject(USER_MODEL) private readonly userModel: IUserStatics,
        private readonly ticketService: TicketDomainService,
        private readonly uploadService: UploadService,
    ) {}

    async index(
        queryParams: {
            type?: string;
            title?: string;
            content?: string;
            targetUser?: string;
            targetTournament?: string;
            assignedGroup?: string;
            isActive?: string;
            showOwn?: string;
            page?: string | number;
        },
        user: IUser | undefined,
    ) {
        const {
            type,
            title,
            content,
            targetUser,
            targetTournament,
            assignedGroup,
            isActive,
            showOwn,
            page = 1,
        } = queryParams;

        const skip = (Number(page) - 1) * DEFAULT_LIMIT;

        const needsContentSearch = content && content.trim().length >= 3;
        const needsUnifiedSearch = type === "ticket" && title && title.trim().length >= 3;

        let ticketIdsFromContent: any[] = [];

        if (needsContentSearch || needsUnifiedSearch) {
            const searchTerm = needsContentSearch ? content.trim() : title!.trim();

            const matchingMessages = await this.ticketService.searchMessageContent(searchTerm);

            if (needsUnifiedSearch) {
                const titleMatchingTickets = await this.ticketModel.find({
                    title: new RegExp(utils.escapeRegexPattern(searchTerm), "i"),
                }).distinct("_id");

                const contentMatchingTickets = await this.ticketModel.find({
                    messages: { $in: matchingMessages },
                }).distinct("_id");

                ticketIdsFromContent = [...new Set([...titleMatchingTickets, ...contentMatchingTickets])];
            } else {
                ticketIdsFromContent = await this.ticketModel.find({
                    messages: { $in: matchingMessages },
                }).distinct("_id");
            }

            if (ticketIdsFromContent.length === 0) {
                return {
                    tickets: [],
                    total: 0,
                    page: Number(page),
                    pages: 0,
                };
            }
        }

        const query: any = {};

        if (type) query.type = user ? type : "ticket";

        if (ticketIdsFromContent.length > 0) {
            query._id = { $in: ticketIdsFromContent };
        } else if (type === "ticket" && title && title.trim().length >= 3) {
            query.title = new RegExp(utils.escapeRegexPattern(title), "i");
        }

        if (type === "report") {
            if (targetUser) {
                const targetUserDoc = await this.userModel.findByUsernameOrOsuId(targetUser);
                if (targetUserDoc) query.targetUser = targetUserDoc._id;
            }
            if (targetTournament) {
                query.targetTournamentName = new RegExp(utils.escapeRegexPattern(targetTournament), "i");
            }
        }
        if (assignedGroup) query.assignedGroup = assignedGroup;
        if (showOwn === "true") query.author = user?._id;
        if (isActive !== undefined) query.isActive = isActive === "true";

        if (!user?.isCommitteeOrAdmin) {
            query.$or = [{ author: user?._id }, { type: "ticket" }];
        }

        const [tickets, total] = await Promise.all([
            this.ticketModel.find(query)
                .sort({ isActive: -1, createdAt: -1 })
                .skip(skip)
                .limit(DEFAULT_LIMIT)
                .populate(DEFAULT_POPULATE),
            this.ticketModel.countDocuments(query),
        ]);

        tickets.forEach((ticket) => this.ticketService.sanitizeTicket(ticket, user));

        return {
            tickets,
            total,
            page: Number(page),
            pages: Math.ceil(total / DEFAULT_LIMIT),
        };
    }

    async getTicket(ticketId: string, user: IUser | undefined) {
        const ticket = await this.ticketModel.findById(ticketId).populate(DEFAULT_POPULATE).orFail();

        if (!ticket.isTicket && !user) {
            throw new ForbiddenException("Not authorized to view this ticket");
        }

        if (!ticket.isTicket && user && !(user.isCommitteeOrAdmin || ticket.author._id.equals(user._id))) {
            throw new ForbiddenException("Not authorized to view this ticket");
        }

        return this.ticketService.sanitizeTicket(ticket, user);
    }

    async create(
        body: {
            title?: string;
            message: string;
            type: string;
            assignedGroup?: string;
            targetUserId?: string;
            targetTournamentName?: string;
            targetTournamentLink?: string;
        },
        files: Express.Multer.File[] | undefined,
        author: IUser,
        session: Session,
    ) {
        const { title, message, type, assignedGroup, targetUserId, targetTournamentName, targetTournamentLink } =
            body;

        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const recentTicket = await this.ticketModel.findOne({
            author: author._id,
            type,
            createdAt: { $gte: oneHourAgo },
        });

        if (recentTicket && !author.isCommittee) {
            throw new HttpException(
                `You have already created a ${type} within the last hour. Please wait before creating another one.`,
                HttpStatus.TOO_MANY_REQUESTS,
            );
        }

        let targetUser: IUser;

        if (type === "ticket" && (title!.length < 5 || title!.length > 80)) {
            throw new BadRequestException("Title must be between 5 and 80 characters");
        }

        if (message.length < 10 || message.length > 8000) {
            throw new BadRequestException("Message must be between 10 and 8000 characters");
        }

        let constructedTitle: string = title ? title.trim() : "";

        if (type === "report") {
            const count = await this.ticketModel.countDocuments({ type: "report" });
            const reportType = targetUserId ? "User" : assignedGroup === "cc" ? "Contest" : "Tournament";
            constructedTitle = `${reportType} Report #${PIF_REPORT_COUNT_OFFSET + count + 1}`;
        }

        const ticket = new this.ticketModel({
            title: constructedTitle,
            type,
            author,
            assignedGroup,
            isActive: true,
        });

        if (type === "report") {
            if (targetUserId) {
                targetUser = await this.userModel.findById(targetUserId).orFail();
                ticket.targetUser = targetUser;
            } else {
                if (!targetTournamentName || !targetTournamentLink) {
                    throw new BadRequestException("Missing target tournament details");
                }

                const sanitizedTournamentName: string = targetTournamentName.trim();
                const sanitizedTournamentLink: string = targetTournamentLink.trim();

                if (sanitizedTournamentName.length < 5 || sanitizedTournamentName.length > 120) {
                    throw new BadRequestException("Tournament name must be between 5 and 120 characters");
                }

                if (!utils.isOsuForumLink(sanitizedTournamentLink)) {
                    throw new BadRequestException("Invalid tournament forum link");
                }

                ticket.targetTournamentName = sanitizedTournamentName;
                ticket.targetTournamentLink = sanitizedTournamentLink;
            }
        }

        const initialMessage = new Message({
            author,
            content: message.trim(),
            isCommittee: false,
            attachments: [],
        });

        initialMessage.attachments = await this.uploadService.handleFileUploads(
            files ?? [],
            FILE_UPLOAD_CATEGORY,
            ticket.id,
            author.id,
        );

        await initialMessage.save();
        ticket.messages.push(initialMessage.id);
        await ticket.save();

        await LogService.generate(
            author.id,
            `Created a new ${type}: [**${ticket.title}**](${config.baseUrl}/${type}s/${ticket._id})`,
            "ticket",
        );

        const roles: ("tournament" | "contest")[] = [];

        if (ticket.assignedGroup === "tc") roles.push("tournament");
        if (ticket.assignedGroup === "cc") roles.push("contest");

        const embedTitle = type === "report" ? `New ${ticket.title}` : `New Ticket: ${ticket.title}`;

        const embed = new EmbedBuilder()
            .setAuthor(DiscordUtils.defaultWebhookAuthor(session))
            .setColor(type === "report" ? DiscordUtils.webhookColors.lightRed : DiscordUtils.webhookColors.blue)
            .setTitle(embedTitle)
            .setUrl(`${config.baseUrl}/${type}s/${ticket._id}`)
            .setFooter(`ID: ${ticket._id}`);

        if (type === "report") {
            if (targetUserId) {
                embed.addField(
                    "Target User",
                    `[**${ticket.targetUser?.username}**](https://osu.ppy.sh/users/${ticket.targetUser?.osuId})`,
                );
            } else {
                embed.addField("Target Tournament", `[**${targetTournamentName}**](${targetTournamentLink})`);
            }
        }

        embed.addField("Message", utils.shorten(message, 512));

        if (initialMessage.attachments?.length) {
            const attachmentsField = utils.getAttachmentsField(initialMessage.attachments)!;
            embed.addField(attachmentsField.name, attachmentsField.value, attachmentsField.inline);
        }

        await new WebhookBuilder()
            .addEmbed(embed)
            .addRoles(roles)
            .setMessage(`New ${capitalize(type)}`)
            .send();

        return { message: `${capitalize(type)} created successfully!`, ticket };
    }

    async sendMessage(
        ticketId: string,
        body: { content: string; isNote?: string | boolean },
        files: Express.Multer.File[] | undefined,
        currentUser: IUser,
        session: Session,
    ) {
        const { content } = body;
        const isNote = body.isNote === "true" || body.isNote === true;

        const ticket = await this.ticketModel.findById(ticketId).populate(DEFAULT_POPULATE).orFail();
        const senderIsTicketAuthor = ticket.author._id.equals(currentUser._id);

        if (!currentUser.isCommittee && !senderIsTicketAuthor) {
            throw new ForbiddenException("Not authorized to message this ticket");
        }

        if (isNote && !currentUser.isCommittee) {
            throw new ForbiddenException("Not authorized to add notes");
        }

        if (content.length < 10 || content.length > 8000) {
            throw new BadRequestException("Message must be between 10 and 8000 characters");
        }

        const newMessage = new Message({
            author: currentUser._id,
            content,
            isCommittee: senderIsTicketAuthor ? false : currentUser.isCommittee,
            isNote,
            attachments: [],
        });

        newMessage.attachments = await this.uploadService.handleFileUploads(
            files ?? [],
            FILE_UPLOAD_CATEGORY,
            ticket.id,
            currentUser.id,
        );

        await newMessage.save();
        ticket.messages.push(newMessage.id);

        if (ticket.snoozedUntil) {
            ticket.snoozedUntil = undefined;
        }

        await ticket.save();

        if (newMessage.isCommittee && !isNote) {
            try {
                await NotificationDispatchService.enqueueOsuAnnouncement({
                    userIds: [ticket.author.osuId],
                    message: {
                        channel: {
                            name: `${ticket.type === "report" ? "Report" : "Ticket"} Response`,
                            description: `Response regarding: ${ticket.title}`,
                        },
                        content: `Your ${ticket.type.toLowerCase()} "*${ticket.title}*" has received a response from the ${
                            ticket.assignedGroup === "tc" ? "Tournament" : "Contest"
                        } Committee.\n\n[View it by clicking here](${config.baseUrl}/${ticket.type.toLowerCase()}s/${
                            ticket._id
                        }).`,
                    },
                    fallbackId: currentUser.osuId,
                });
            } catch {
                // enqueue failures were previously swallowed
            }
        }

        await LogService.generate(
            currentUser.id,
            `Sent a message in ${ticket.type}: [**${ticket.title}**](${config.baseUrl}/${ticket.type}s/${ticket._id})`,
            "ticket",
        );

        const committeeMembers = new Set<string>();

        if (senderIsTicketAuthor) {
            ticket.messages.forEach((msg) => {
                if (msg?.author && !msg.isNote && msg.isCommittee) {
                    committeeMembers.add(msg.author.discordId || msg.author.username);
                }
            });
        }

        const embed = new EmbedBuilder()
            .setAuthor(DiscordUtils.defaultWebhookAuthor(session))
            .setColor(isNote ? DiscordUtils.webhookColors.lightBlue : DiscordUtils.webhookColors.darkBlue)
            .setDescription(
                `${isNote ? "Added a note" : "Sent a message"} in ${ticket.type}: [**${ticket.title}**](${
                    config.baseUrl
                }/${ticket.type}s/${ticket._id})`,
            );

        embed.addField(isNote ? "Note" : "Message", utils.shorten(content, 512));

        if (newMessage.attachments?.length) {
            const attachmentsField = utils.getAttachmentsField(newMessage.attachments)!;
            embed.addField(attachmentsField.name, attachmentsField.value, attachmentsField.inline);
        }

        const webhookBuilder = new WebhookBuilder().addEmbed(embed).addUsers(Array.from(committeeMembers));

        if (ticket.threadId) {
            webhookBuilder.setThreadId(ticket.threadId);
        }

        await webhookBuilder.send();

        return { message: isNote ? "Added a note successfully!" : "Message sent successfully!" };
    }

    async toggleStatus(ticketId: string, user: IUser, session: Session) {
        const ticket = await this.ticketModel.findById(ticketId).orFail();

        ticket.isActive = !ticket.isActive;

        const eventMessage = new Message({
            author: user._id,
            content: ticket.isActive ? "Ticket reopened" : "Ticket closed",
            isCommittee: true,
            event: ticket.isActive ? "reopen" : "close",
        });

        await eventMessage.save();
        ticket.messages.push(eventMessage.id);

        await ticket.save();

        await LogService.generate(
            user.id,
            `${ticket.isActive ? "Reopened" : "Closed"} ${ticket.type}: [**${ticket.title}**](${config.baseUrl}/${
                ticket.type
            }s/${ticket._id})`,
            "ticket",
        );

        const embed = new EmbedBuilder()
            .setAuthor(DiscordUtils.defaultWebhookAuthor(session))
            .setColor(ticket.isActive ? DiscordUtils.webhookColors.gray : DiscordUtils.webhookColors.black)
            .setDescription(
                `${ticket.isActive ? "Reopened" : "Closed"} ${ticket.type}: [**${ticket.title}**](${config.baseUrl}/${
                    ticket.type
                }s/${ticket._id})`,
            );

        const webhookBuilder = new WebhookBuilder().addEmbed(embed);
        if (ticket.threadId) {
            webhookBuilder.setThreadId(ticket.threadId);
        }
        await webhookBuilder.send();

        return {
            message: `${capitalize(ticket.type)} ${ticket.isActive ? "reopened" : "closed"} successfully!`,
            ticket,
        };
    }

    async updateThreadId(ticketId: string, threadIdInput: string | undefined, user: IUser, session: Session) {
        let threadId = threadIdInput;

        const ticket = await this.ticketModel.findById(ticketId).orFail();

        threadId = utils.extractDiscordThreadId(threadId ?? null) ?? undefined;

        if (threadId !== ticket.threadId) {
            ticket.threadId = threadId;
            await ticket.save();

            await LogService.generate(
                user.id,
                `Updated thread ID for ${ticket.type}: [**${ticket.title}**](${config.baseUrl}/${ticket.type}s/${
                    ticket._id
                }) to "${threadId ?? "t-committee"}"`,
                "ticket",
            );

            const embed = new EmbedBuilder()
                .setAuthor(DiscordUtils.defaultWebhookAuthor(session))
                .setColor(DiscordUtils.webhookColors.white)
                .setDescription(
                    `Updated webhook location for ${ticket.type}: [**${ticket.title}**](${config.baseUrl}/${ticket.type}s/${ticket._id})`,
                )
                .addField(
                    "New Location",
                    `<#${threadId && threadId.length ? threadId : config.discord.webhooks.main.channelId}>`,
                );

            const webhookBuilder = new WebhookBuilder().addEmbed(embed);
            if (ticket.threadId) {
                webhookBuilder.setThreadId(ticket.threadId);
            }
            await webhookBuilder.send();

            return { message: "Thread ID updated successfully!" };
        }

        return { message: "Thread ID is already set!" };
    }

    async snoozeTicket(ticketId: string, user: IUser, session: Session) {
        const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        const ticket = await this.ticketModel.findById(ticketId).orFail();

        ticket.snoozedUntil = sevenDaysFromNow;
        await ticket.save();

        await LogService.generate(
            user.id,
            `Snoozed reminders for ${ticket.type}: [**${ticket.title}**](${config.baseUrl}/${ticket.type}s/${ticket._id})`,
            "ticket",
        );

        const embed = new EmbedBuilder()
            .setAuthor(DiscordUtils.defaultWebhookAuthor(session))
            .setColor(DiscordUtils.webhookColors.purple)
            .setDescription(
                `Snoozed reminders for ${ticket.type}: [**${ticket.title}**](${config.baseUrl}/${ticket.type}s/${ticket._id})`,
            )
            .addField("Snoozed until", utils.discordTimestamp(sevenDaysFromNow, "dateTime"));

        const webhookBuilder = new WebhookBuilder().addEmbed(embed);
        if (ticket.threadId) {
            webhookBuilder.setThreadId(ticket.threadId);
        }
        await webhookBuilder.send();

        return { message: "Reminders for this ticket will be shown again in 7 days!" };
    }

    async editReport(
        ticketId: string,
        body: {
            targetUserId?: string;
            targetTournamentName?: string;
            targetTournamentLink?: string;
        },
        currentUser: IUser,
        session: Session,
    ) {
        const { targetUserId, targetTournamentName, targetTournamentLink } = body;

        const ticket = await this.ticketModel.findById(ticketId).populate(DEFAULT_POPULATE).orFail();

        if (ticket.type !== "report") {
            throw new BadRequestException("Only reports can be edited");
        }

        if (ticket.isActive) {
            throw new BadRequestException("Cannot edit an active report.");
        }

        const isEditingUser = targetUserId !== undefined;
        const isEditingTournament = targetTournamentName !== undefined || targetTournamentLink !== undefined;

        if (isEditingUser && isEditingTournament) {
            throw new BadRequestException("Cannot set both target user and target tournament");
        }

        if (!isEditingUser && !isEditingTournament) {
            throw new BadRequestException("Must provide either target user or target tournament");
        }

        if (isEditingUser) {
            const targetUser = await this.userModel.findById(targetUserId).orFail();

            ticket.targetUser = targetUser;
            ticket.targetTournamentName = undefined;
            ticket.targetTournamentLink = undefined;

            ticket.title = ticket.title.replace(/^[^ ]+/, "User");

            await ticket.save();

            await LogService.generate(
                currentUser.id,
                `Updated target for report: [**${ticket.title}**](${config.baseUrl}/reports/${ticket._id}) to user **${targetUser.username}**`,
                "ticket",
            );

            const embed = new EmbedBuilder()
                .setAuthor(DiscordUtils.defaultWebhookAuthor(session))
                .setColor(DiscordUtils.webhookColors.orange)
                .setDescription(
                    `Updated target for report: [**${ticket.title}**](${config.baseUrl}/reports/${ticket._id})`,
                )
                .addField(
                    "New Target User",
                    `[**${targetUser.username}**](https://osu.ppy.sh/users/${targetUser.osuId})`,
                );

            const webhookBuilder = new WebhookBuilder().addEmbed(embed);
            if (ticket.threadId) {
                webhookBuilder.setThreadId(ticket.threadId);
            }
            await webhookBuilder.send();
        }

        if (isEditingTournament) {
            if (!targetTournamentName || !targetTournamentLink) {
                throw new BadRequestException("Both tournament name and link are required");
            }

            const sanitizedTournamentName = targetTournamentName.trim();
            const sanitizedTournamentLink = targetTournamentLink.trim();

            if (sanitizedTournamentName.length < 3 || sanitizedTournamentName.length > 120) {
                throw new BadRequestException("Tournament name must be between 3 and 120 characters");
            }

            if (!utils.isOsuForumLink(sanitizedTournamentLink)) {
                throw new BadRequestException("Invalid tournament forum link");
            }

            ticket.targetUser = undefined;
            ticket.targetTournamentName = sanitizedTournamentName;
            ticket.targetTournamentLink = sanitizedTournamentLink;

            ticket.title = ticket.title.replace(/^[^ ]+/, ticket.assignedGroup === "cc" ? "Contest" : "Tournament");

            await ticket.save();

            await LogService.generate(
                currentUser.id,
                `Updated target for report: [**${ticket.title}**](${config.baseUrl}/reports/${ticket._id}) to tournament **${sanitizedTournamentName}**`,
                "ticket",
            );

            const embed = new EmbedBuilder()
                .setAuthor(DiscordUtils.defaultWebhookAuthor(session))
                .setColor(DiscordUtils.webhookColors.orange)
                .setDescription(
                    `Updated target for report: [**${ticket.title}**](${config.baseUrl}/reports/${ticket._id})`,
                )
                .addField("New Target Tournament", `[**${sanitizedTournamentName}**](${sanitizedTournamentLink})`);

            const webhookBuilder = new WebhookBuilder().addEmbed(embed);
            if (ticket.threadId) {
                webhookBuilder.setThreadId(ticket.threadId);
            }
            await webhookBuilder.send();
        }

        return { message: "Report updated successfully!" };
    }
}
