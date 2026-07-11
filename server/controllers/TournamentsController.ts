import { Request, Response } from "express";
import { Types } from "mongoose";
import Tournament from "../models/tournamentModel";
import UserService from "../services/UserService";
import {
    TournamentQueryParams,
    TournamentType,
    TournamentStatus,
    GameMode,
    ITournament,
    ITournamentExtraLink,
} from "../../interfaces/Tournament";
import { IUser, UserGroup } from "../../interfaces/User";
import User from "../models/userModel";
import UploadService from "../services/UploadService";
import Review from "../models/reviewModel";
import sharp from "sharp";
import archiver from "archiver";
import axios from "axios";
import TournamentService from "../services/TournamentService";
import LogService from "../services/LogService";
import NotificationDispatchService from "../services/NotificationDispatchService";
import capitalize from "lodash/capitalize.js";
import startCase from "lodash/startCase.js";
import dayjs from "../../utils/dayjs";
import { EmbedBuilder } from "../services/discord/EmbedBuilder";
import { WebhookBuilder } from "../services/discord/WebhookBuilder";
import DiscordUtils from "../services/discord/DiscordUtils";
import config from "../../config.json";
import Message from "../models/messageModel";
import utils from "../../utils/server";
import { ITicket } from "../../interfaces/Ticket";
import { IVoting } from "../../interfaces/Voting";

const defaultPopulate = [
    {
        path: "hosts",
        select: "username osuId groups coverUrl country",
        populate: { path: "infringements" },
    },
    {
        path: "assignedReviewers",
        select: "username osuId groups coverUrl isActiveReviewer isActiveVoter country discordId email",
    },
    {
        path: "reviews",
        select: "comment author vote checklist createdAt updatedAt",
        populate: {
            path: "author",
            select: "username osuId groups coverUrl country",
        },
    },
    {
        path: "badges",
        select: "url",
    },
    {
        path: "logs",
        select: "user action createdAt",
        populate: {
            path: "user",
            select: "username osuId groups coverUrl country",
        },
    },
    {
        path: "reviewHistory",
        populate: {
            path: "user",
            select: "username osuId groups coverUrl country",
        },
    },
    {
        path: "notes",
        select: "content author isNote attachments createdAt",
        populate: [
            {
                path: "author",
                select: "username osuId groups coverUrl country",
            },
            {
                path: "attachments",
                select: "originalName url size type",
            },
        ],
    },
    {
        path: "winners",
        select: "username osuId groups coverUrl country",
        populate: { path: "infringements" },
    },
];

const DEFAULT_LIMIT = 30;

const FILE_UPLOAD_CATEGORY = "tournaments";

interface TournamentEditContext {
    tournament: ITournament;
    body: Record<string, unknown>;
    currentUser: IUser;
    actioner: IUser;
    session: Request["session"];
}

interface TournamentEditField {
    isSet: (body: Record<string, unknown>) => boolean;
    archivedAllowed: boolean;
    hostAllowed: boolean;
    errorStatus: 400 | 403;
    run: (ctx: TournamentEditContext) => Promise<{ error?: string }>;
}

const TOURNAMENT_EDIT_FIELDS: TournamentEditField[] = [
    {
        isSet: (body) => body.name !== undefined,
        archivedAllowed: true,
        hostAllowed: false,
        errorStatus: 400,
        run: ({ tournament, body, currentUser }) =>
            TournamentService.updateName(tournament, body.name as string, currentUser),
    },
    {
        isSet: (body) => body.hostIds !== undefined,
        archivedAllowed: true,
        hostAllowed: false,
        errorStatus: 400,
        run: ({ tournament, body, currentUser }) =>
            TournamentService.updateHosts(tournament, body.hostIds as string[], currentUser),
    },
    {
        isSet: (body) => body.modes !== undefined,
        archivedAllowed: true,
        hostAllowed: false,
        errorStatus: 403,
        run: ({ tournament, body, currentUser }) =>
            TournamentService.updateModes(tournament, body.modes as ITournament["modes"], currentUser),
    },
    {
        isSet: (body) => body.type !== undefined,
        archivedAllowed: true,
        hostAllowed: false,
        errorStatus: 403,
        run: ({ tournament, body, currentUser }) =>
            TournamentService.updateType(tournament, body.type as ITournament["type"], currentUser),
    },
    {
        isSet: (body) => body.forumUrl !== undefined,
        archivedAllowed: false,
        hostAllowed: false,
        errorStatus: 400,
        run: ({ tournament, body, currentUser }) =>
            TournamentService.updateForumUrl(tournament, body.forumUrl as string, currentUser),
    },
    {
        isSet: (body) => body.extraLinks !== undefined,
        archivedAllowed: true,
        hostAllowed: false,
        errorStatus: 400,
        run: ({ tournament, body, currentUser }) =>
            TournamentService.updateExtraLinks(tournament, body.extraLinks as ITournamentExtraLink[], currentUser),
    },
    {
        isSet: (body) => body.enchantUrl !== undefined,
        archivedAllowed: false,
        hostAllowed: false,
        errorStatus: 400,
        run: ({ tournament, body, currentUser }) =>
            TournamentService.updateEnchantUrl(tournament, body.enchantUrl as string, currentUser),
    },
    {
        isSet: (body) => body.startDate != null && body.endDate != null,
        archivedAllowed: false,
        hostAllowed: false,
        errorStatus: 400,
        run: ({ tournament, body, currentUser }) =>
            TournamentService.updateDates(tournament, body.startDate as Date, body.endDate as Date, currentUser),
    },
    {
        isSet: (body) => body.tags !== undefined,
        archivedAllowed: true,
        hostAllowed: false,
        errorStatus: 400,
        run: ({ tournament, body, actioner }) =>
            TournamentService.updateTags(tournament, body.tags as string[], actioner),
    },
    {
        isSet: (body) => typeof body.bannerUrl === "string",
        archivedAllowed: true,
        hostAllowed: true,
        errorStatus: 400,
        run: ({ tournament, body, actioner }) =>
            TournamentService.updateBanner(tournament, body.bannerUrl as string, actioner),
    },
    {
        isSet: (body) => body.winners !== undefined,
        archivedAllowed: true,
        hostAllowed: false,
        errorStatus: 400,
        run: ({ tournament, body, currentUser }) =>
            TournamentService.updateWinners(tournament, body.winners as IUser[], currentUser),
    },
    {
        isSet: (body) => body.status !== undefined,
        archivedAllowed: false,
        hostAllowed: false,
        errorStatus: 400,
        run: ({ tournament, body, currentUser, session }) =>
            TournamentService.updateStatus(tournament, body.status as ITournament["status"], currentUser, session),
    },
    {
        isSet: (body) => body.isActive !== undefined,
        archivedAllowed: true,
        hostAllowed: false,
        errorStatus: 400,
        run: ({ tournament, body, currentUser, session }) =>
            TournamentService.updateIsActive(tournament, body.isActive as boolean, currentUser, session),
    },
];

function hasArchivedAllowedEdit(body: Record<string, unknown>): boolean {
    return TOURNAMENT_EDIT_FIELDS.some((field) => field.archivedAllowed && field.isSet(body));
}

function hasNonHostEdit(body: Record<string, unknown>): boolean {
    return TOURNAMENT_EDIT_FIELDS.some((field) => field.isSet(body) && !field.hostAllowed);
}

const selectFields = (isCommittee: boolean) =>
    isCommittee ? "" : "-assignedReviewers -notes -logs -threadId -enchantUrl";

class TournamentsController {
    /** GET tournament listing */
    public async index(req: Request, res: Response) {
        const { search, mode, host, type, status, state, showAllAssignedReviews, page = 1 } = req.query;
        const query: TournamentQueryParams = {};
        const user = res.locals!.user;

        if (search) {
            const searchQuery = TournamentService.createSearchQuery(search as string);
            if (searchQuery.$and) {
                query.$and = searchQuery.$and;
            }
        }
        if (mode) query.modes = { $in: [mode as GameMode] };
        if (host) {
            const hostUser = await User.findByUsernameOrOsuId(host as string);
            if (hostUser) query.hosts = { $in: [hostUser._id] };
        }
        if (type) query.type = type as TournamentType;
        if (status) query.status = status as TournamentStatus;

        if (state === "active") {
            query.isActive = true;
        } else if (state === "archived" || state === "concluded") {
            query.isActive = false;
        }

        if (showAllAssignedReviews === "true" && user && user.isCommittee) {
            if (query.$and) {
                query.$and.push({ assignedReviewers: user._id });
            } else {
                query.$and = [{ assignedReviewers: user._id }];
            }
        }

        const skip = (Number(page) - 1) * DEFAULT_LIMIT;

        const [tournaments, total] = await Promise.all([
            Tournament.aggregate([
                { $match: query },
                {
                    $addFields: {
                        // Add a field to check if tournament needs user's review
                        needsUserReview: {
                            $cond: {
                                if: {
                                    $and: [
                                        // User exists and is assigned
                                        { $in: [user?._id, { $ifNull: ["$assignedReviewers", []] }] },
                                        // Status is reviewOngoing or changesRequested
                                        {
                                            $in: ["$status", ["reviewOngoing", "changesRequested"]],
                                        },
                                        // Tournament is active
                                        { $eq: ["$isActive", true] },
                                    ],
                                },
                                then: true,
                                else: false,
                            },
                        },
                        statusOrder: {
                            $switch: {
                                branches: [
                                    {
                                        case: {
                                            $or: [
                                                { $eq: ["$status", "noBadgeRequested"] },
                                                { $eq: ["$status", "badgeRejected"] },
                                                { $eq: ["$status", "badgeApproved"] },
                                            ],
                                        },
                                        then: 1,
                                    },
                                    { case: { $eq: ["$status", "changesRequested"] }, then: 2 },
                                    { case: { $eq: ["$status", "onHold"] }, then: 3 },
                                    { case: { $eq: ["$status", "reviewOngoing"] }, then: 4 },
                                    { case: { $eq: ["$status", "screeningConcluded"] }, then: 5 },
                                    { case: { $eq: ["$status", "supportRequestReceived"] }, then: 6 },
                                ],
                                default: 7,
                            },
                        },
                    },
                },
                {
                    $sort: {
                        needsUserReview: -1, // Sort by needs review first
                        isActive: -1, // Then by active status
                        statusOrder: 1, // Then by status order
                        createdAt: -1, // Finally by creation date
                    },
                },
                { $skip: skip },
                { $limit: DEFAULT_LIMIT },
                {
                    $project: {
                        statusOrder: 0,
                        needsUserReview: 0,
                    },
                },
            ])
                .exec()
                .then((tournaments: ITournament[]) => Tournament.populate(tournaments, defaultPopulate))
                .then((tournaments: ITournament[]) =>
                    tournaments.map((t) =>
                        TournamentService.sanitizeTournamentListing(Tournament.hydrate(t).toJSON(), user),
                    ),
                ),
            Tournament.countDocuments(query),
        ]);

        res.json({
            tournaments,
            total,
            page: Number(page),
            pages: Math.ceil(total / DEFAULT_LIMIT),
        });
    }

    /** GET tournament */
    public async getTournament(req: Request, res: Response) {
        const tournamentId = req.params.tournamentId;
        const user = res.locals!.user;
        const isCommitteeOrAdmin = !!user && user.isCommitteeOrAdmin;

        let tournament = await Tournament.findById(tournamentId)
            .select(selectFields(isCommitteeOrAdmin))
            .populate(defaultPopulate)
            .orFail();

        tournament = TournamentService.censorTournamentData(tournament, res.locals!.user);

        let reports: ITicket[] = [];
        let votings: IVoting[] = [];

        if (isCommitteeOrAdmin) {
            [reports, votings] = await Promise.all([
                TournamentService.getRelatedReports(tournament),
                TournamentService.getRelatedVotings(tournament),
            ]);
            return res.json({ tournament, reports, votings });
        }

        res.json({ tournament });
    }

    /** POST create a tournament */
    public async create(req: Request, res: Response) {
        const {
            name,
            hostIds,
            modes,
            type,
            forumUrl,
            startDate,
            endDate,
            bannerUrl,
            enchantUrl,
            tags,
            extraLinks,
            threadId: rawThreadId,
            winners,
        } = req.body;
        const currentUser = res.locals!.user!;

        // Handle both single hostId (legacy) and multiple hostIds
        const hostIdArray = Array.isArray(hostIds) ? hostIds : hostIds ? [hostIds] : [];

        if (hostIdArray.length === 0) {
            return res.status(400).json({ error: "At least one host is required" });
        }

        const hostsUnordered = await User.find({ _id: { $in: hostIdArray } });

        if (hostsUnordered.length !== hostIdArray.length) {
            return res.status(400).json({ error: "One or more host IDs are invalid" });
        }

        // Preserve the order of hosts based on hostIdArray
        const hosts = hostIdArray
            .map((id) => hostsUnordered.find((host) => host._id.toString() === id))
            .filter((host) => host !== undefined) as typeof hostsUnordered;

        const status: TournamentStatus = "supportRequestReceived";

        if (forumUrl && !utils.isOsuForumLink(forumUrl)) {
            return res.status(400).json({ error: "Invalid osu! forum URL format" });
        }

        if (enchantUrl && !utils.isEnchantTicketLink(enchantUrl)) {
            return res.status(400).json({ error: "Invalid Enchant ticket URL format" });
        }

        if (bannerUrl && !utils.isValidUrl(bannerUrl)) {
            return res.status(400).json({ error: "Banner URL must be a valid URL" });
        }

        if (name && !utils.isLatinScriptOnly(name)) {
            return res.status(400).json({ error: "Name must be in Latin script (no Cyrillic, Chinese, etc.)" });
        }

        let normalizedExtraLinks: ITournamentExtraLink[] = [];
        if (extraLinks !== undefined) {
            const extraLinksError = utils.validateExtraLinks(extraLinks);
            if (extraLinksError) {
                return res.status(400).json({ error: extraLinksError });
            }
            normalizedExtraLinks = (extraLinks as ITournamentExtraLink[]).map((link) => ({
                type: link.type,
                name: link.name.trim(),
                url: link.url.trim(),
            }));
        }

        const threadId = utils.extractDiscordThreadId(rawThreadId ?? null);

        let winnerIds: string[] = [];
        if (winners !== undefined) {
            if (!Array.isArray(winners)) {
                return res.status(400).json({ error: "Winners must be an array" });
            }
            winnerIds = winners.map((w: IUser | string) =>
                typeof w === "string" ? w : ((w as IUser)._id?.toString?.() ?? (w as IUser).id)
            );
            if (winnerIds.some((id) => !id)) {
                return res.status(400).json({ error: "One or more winner IDs are invalid" });
            }
            if (winnerIds.length > 0) {
                const foundWinners = await User.find({ _id: { $in: winnerIds } });
                if (foundWinners.length !== winnerIds.length) {
                    return res.status(400).json({ error: "One or more winner IDs are invalid" });
                }
            }
        }

        // Check for active infringements on any host
        const hostsWithInfringements = hosts.filter((host) => host.activeInfringement);
        if (hostsWithInfringements.length > 0) {
            const hostnames = hostsWithInfringements.map((host) => host.username).join(", ");
            return res.status(400).json({
                error: `Cannot create tournament with hosts that have active infringements: ${hostnames}`,
            });
        }

        const lowerCaseTags = tags?.map((tag: string) => tag.toLowerCase());

        // remove query parameters from forum url
        const cleanForumUrl = forumUrl?.split("?")[0] ?? forumUrl;

        const tournament = new Tournament({
            name,
            hosts: hosts.map((host) => host._id),
            modes,
            type,
            status,
            forumUrl: cleanForumUrl,
            startDate,
            endDate,
            bannerUrl,
            enchantUrl,
            tags: lowerCaseTags,
            extraLinks: normalizedExtraLinks,
            threadId: threadId || undefined,
            winners: winnerIds,
        });

        await tournament.save();

        res.json({ message: "Tournament created successfully!", tournament });

        // logging
        await LogService.generate(currentUser.id, `Created ${tournament.type}: **${tournament.name}**`, "tournament");
        await TournamentService.addTournamentLog(
            tournament,
            currentUser,
            `Created ${tournament.type}`,
            tournament.isTournament ? "trophy" : "award",
        );

        // Discord
        const hostsList = utils.formatHostsList(hosts, { mdLinks: true });
        const embed = new EmbedBuilder()
            .setAuthor(DiscordUtils.defaultWebhookAuthor(req.session))
            .setColor(DiscordUtils.webhookColors.green)
            .setDescription(
                `Created a new ${tournament.type}: [**${tournament.name}**](${config.baseUrl}/tournaments/${tournament._id})`,
            )
            .addField(hosts.length === 1 ? "Host" : "Hosts", hostsList)
            .addField("Start Date", dayjs(tournament.startDate).format("YYYY-MM-DD"), true)
            .addField("End Date", dayjs(tournament.endDate).format("YYYY-MM-DD"), true)
            .addField("Game Mode", "<:osutaiko:1054779616583221278>", true)
            .addField("Forum URL", tournament.forumUrl.length ? tournament.forumUrl : "*None*")
            .addField(
                "Extra Links",
                tournament.extraLinks?.length
                    ? tournament.extraLinks.map((link) => `- [${link.name}](${link.url})`).join("\n")
                    : "*None*",
            )
            .addField(
                "Search Tags",
                tournament.tags && tournament.tags.length
                    ? tournament.tags.map((tag) => `\`${tag}\``).join(", ")
                    : "*None*",
            );

        if (tournament.bannerUrl) {
            embed.setImage(tournament.bannerUrl);
        }

        await new WebhookBuilder().addEmbed(embed).send();
    }

    /** POST assign reviewers */
    public async assignReviewers(req: Request, res: Response) {
        const tournamentId = req.params.tournamentId;
        const currentUser = res.locals!.user!;

        const tournament = await Tournament.findById(tournamentId).populate("hosts winners").orFail();

        const reviewerTypeMap: { [key in TournamentType]: UserGroup } = {
            tournament: "tc",
            contest: "cc",
        };

        const assignedReviewersType = reviewerTypeMap[tournament.type];

        const usersToExclude: string[] = [];

        if (tournament.hosts && tournament.hosts.length > 0) {
            tournament.hosts.forEach((host) => {
                usersToExclude.push(host._id.toString());
            });
        }

        if (tournament.winners && tournament.winners.length > 0) {
            tournament.winners.forEach((winner) => {
                usersToExclude.push(winner._id.toString());
            });
        }

        let reviewers: IUser[] = [];

        if (assignedReviewersType === "cc") {
            // assign all of CC
            if (usersToExclude.length > 0) {
                const excludeObjectIds = usersToExclude.map((id) => new Types.ObjectId(id));
                reviewers = await User.find({
                    groups: { $in: ["cc"] },
                    _id: { $nin: excludeObjectIds },
                }).sort("username");
            } else {
                reviewers = await User.find({ groups: { $in: ["cc"] } }).sort("username");
            }
        } else {
            reviewers = await UserService.assignReviewers(assignedReviewersType, usersToExclude);
        }

        tournament.assignedReviewers = reviewers;

        if (!tournament.reviewHistory) tournament.reviewHistory = [];
        const now = new Date();
        for (const reviewer of reviewers) {
            tournament.reviewHistory!.push({
                user: reviewer._id as Types.ObjectId,
                action: "initial",
                createdAt: now,
                updatedAt: now,
            });
        }

        await tournament.save();

        res.json({ message: "Reviewers assigned successfully!" });

        // logging
        await TournamentService.addTournamentLog(
            tournament,
            currentUser,
            `Assigned reviewers: ${utils.formatHostsList(reviewers, { mdLinks: true })}`,
            "users",
        );

        await LogService.generate(
            currentUser.id,
            `Assigned reviewers to **${tournament.name}**: ${utils.formatHostsList(reviewers, { mdLinks: true })}`,
            "tournament",
        );

        // Discord
        const usersToPing = reviewers.map((r) => r.discordId || r.username);

        const embed = new EmbedBuilder()
            .setAuthor(DiscordUtils.defaultWebhookAuthor(req.session))
            .setColor(DiscordUtils.webhookColors.orange)
            .setDescription(
                `Assigned reviewers to ${tournament.type}: [**${tournament.name}**](${config.baseUrl}/tournaments/${tournament._id})`,
            )
            .addField("Reviewers", reviewers.map((r) => `[**${r.username}**](${r.osuProfileUrl})`).join(", "));

        const webhookBuilder = new WebhookBuilder()
            .addEmbed(embed)
            .addUsers(usersToPing)
            .setMessage(`New ${capitalize(tournament.type)} Review`);

        if (tournament.threadId) {
            webhookBuilder.setThreadId(tournament.threadId);
        }

        await webhookBuilder.send();
    }

    /** PATCH add reviewer */
    public async addReviewer(req: Request, res: Response) {
        const tournamentId = req.params.tournamentId;
        const currentUser = res.locals!.user!;
        const { reviewerId } = req.body;

        if (!reviewerId) {
            return res.status(400).json({ error: "reviewerId is required" });
        }

        const tournament = await Tournament.findById(tournamentId).populate("hosts winners").orFail();

        const reviewerTypeMap: { [key in TournamentType]: UserGroup } = {
            tournament: "tc",
            contest: "cc",
        };
        const requiredGroup = reviewerTypeMap[tournament.type];

        const currentReviewerIds = (tournament.assignedReviewers || []).map((r: any) => r.toString());
        const usersToExclude: string[] = [...currentReviewerIds];
        if (tournament.hosts?.length) {
            tournament.hosts.forEach((host: IUser) => usersToExclude.push(host._id.toString()));
        }
        if (tournament.winners?.length) {
            tournament.winners.forEach((winner: IUser) => usersToExclude.push(winner._id.toString()));
        }

        const user = await User.findById(reviewerId);
        if (!user) {
            return res.status(400).json({ error: "User not found" });
        }
        if (!user.groups.includes(requiredGroup)) {
            return res.status(400).json({
                error: `${user.username} is not a member of ${requiredGroup.toUpperCase()}`,
            });
        }
        if (usersToExclude.includes(reviewerId)) {
            return res.status(400).json({ error: `${user.username} is already assigned or excluded` });
        }

        const existingIds = (tournament.assignedReviewers || []).map((r: any) =>
            r instanceof Types.ObjectId ? r : r._id,
        );
        tournament.assignedReviewers = [...existingIds, user._id] as any;

        if (!tournament.reviewHistory) tournament.reviewHistory = [];
        const now = new Date();
        tournament.reviewHistory.push({
            user: user._id as Types.ObjectId,
            action: "assign",
            createdAt: now,
            updatedAt: now,
        });

        await tournament.save();

        if (tournament.type === "tournament") {
            user.inBag = false;
            await user.save();
        }

        res.json({ message: "Reviewer added successfully!" });

        await TournamentService.addTournamentLog(
            tournament,
            currentUser,
            `Added reviewer: [**${user.username}**](${user.osuProfileUrl})`,
            "users",
        );
        await LogService.generate(
            currentUser.id,
            `Added reviewer to **${tournament.name}**: [**${user.username}**](${user.osuProfileUrl})`,
            "tournament",
        );

        const embed = new EmbedBuilder()
            .setAuthor(DiscordUtils.defaultWebhookAuthor(req.session))
            .setColor(DiscordUtils.webhookColors.orange)
            .setDescription(
                `Added reviewer to ${tournament.type}: [**${tournament.name}**](${config.baseUrl}/tournaments/${tournament._id})`,
            )
            .addField("Added", `[**${user.username}**](${user.osuProfileUrl})`);
        const webhookBuilder = new WebhookBuilder()
            .addEmbed(embed)
            .addUsers([user.discordId || user.username])
            .setMessage(`Reviewer added to ${capitalize(tournament.type)}`);
        if (tournament.threadId) webhookBuilder.setThreadId(tournament.threadId);
        await webhookBuilder.send();
    }

    /** PATCH remove reviewer */
    public async removeReviewer(req: Request, res: Response) {
        const tournamentId = req.params.tournamentId;
        const currentUser = res.locals!.user!;
        const { reviewerId } = req.body;

        if (!reviewerId) {
            return res.status(400).json({ error: "reviewerId is required" });
        }

        const tournament = await Tournament.findById(tournamentId).orFail();

        if (!tournament.assignedReviewers || tournament.assignedReviewers.length === 0) {
            return res.status(400).json({ error: "Tournament has no assigned reviewers" });
        }

        const index = tournament.assignedReviewers.findIndex((r: any) => r.toString() === reviewerId);
        if (index === -1) {
            return res.status(400).json({ error: "Reviewer is not assigned to this tournament" });
        }

        const removedUser = await User.findById(reviewerId).orFail();
        const updatedReviewers = tournament.assignedReviewers.filter((r: any) => r.toString() !== reviewerId);
        await Tournament.findByIdAndUpdate(
            tournamentId,
            { assignedReviewers: updatedReviewers },
            { runValidators: true },
        );

        if (tournament.type === "tournament") {
            removedUser.inBag = true;
            await removedUser.save();
        }

        res.json({ message: "Reviewer removed successfully!" });

        await TournamentService.addTournamentLog(
            tournament,
            currentUser,
            `Removed reviewer: [**${removedUser.username}**](${removedUser.osuProfileUrl})`,
            "user-minus",
        );

        const now = new Date();
        await Tournament.findByIdAndUpdate(tournamentId, {
            $push: {
                reviewHistory: {
                    user: removedUser._id,
                    action: "remove",
                    createdAt: now,
                    updatedAt: now,
                },
            },
        });

        await LogService.generate(
            currentUser.id,
            `Removed reviewer from **${tournament.name}**: [**${removedUser.username}**](${removedUser.osuProfileUrl})`,
            "tournament",
        );

        const embed = new EmbedBuilder()
            .setAuthor(DiscordUtils.defaultWebhookAuthor(req.session))
            .setColor(DiscordUtils.webhookColors.red)
            .setDescription(
                `Removed reviewer from ${tournament.type}: [**${tournament.name}**](${config.baseUrl}/tournaments/${tournament._id})`,
            )
            .addField("Removed", `[**${removedUser.username}**](${removedUser.osuProfileUrl})`);
        const webhookBuilder = new WebhookBuilder().addEmbed(embed);
        if (tournament.threadId) webhookBuilder.setThreadId(tournament.threadId);
        await webhookBuilder.send();
    }

    /** POST edit tournament */
    public async edit(req: Request, res: Response) {
        const tournamentId = req.params.tournamentId;
        const currentUser = res.locals!.user!;
        const body = req.body as Record<string, unknown>;

        const tournament = await Tournament.findById(tournamentId).populate(defaultPopulate).orFail();

        if (!tournament.isActive && !hasArchivedAllowedEdit(body)) {
            return res.status(400).json({ error: "Cannot edit archived tournament!" });
        }

        let actioner = currentUser;
        const isHost = tournament.hosts?.some((host) => host._id.equals(currentUser._id));

        if (!currentUser.isCommitteeOrAdmin && !isHost) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        if (!currentUser.isCommittee && isHost) {
            actioner = tournament.hosts.find((host) => host._id.equals(currentUser._id)) || currentUser;

            if (hasNonHostEdit(body)) {
                return res.status(403).json({ error: "Hosts can only edit banner!" });
            }
        }

        for (const field of TOURNAMENT_EDIT_FIELDS) {
            if (!field.isSet(body)) continue;

            const result = await field.run({
                tournament,
                body,
                currentUser,
                actioner,
                session: req.session,
            });

            if (result.error) {
                return res.status(field.errorStatus).json({ error: result.error });
            }
        }

        await tournament.save();

        res.json({ message: "Tournament updated successfully!" });
    }

    /** PATCH bulk edit tournaments */
    public async bulkEdit(req: Request, res: Response) {
        const currentUser = res.locals!.user!;
        const { tournamentIds, status, isActive } = req.body as {
            tournamentIds?: string[];
            status?: TournamentStatus;
            isActive?: boolean;
        };

        if (!Array.isArray(tournamentIds) || tournamentIds.length === 0) {
            return res.status(400).json({ error: "tournamentIds must be a non-empty array" });
        }

        if (status === undefined && isActive === undefined) {
            return res.status(400).json({ error: "At least one field (status or isActive) is required" });
        }

        const uniqueTournamentIds = Array.from(new Set(tournamentIds));
        const results = await Promise.all(
            uniqueTournamentIds.map(async (tournamentId) => {
                try {
                    const tournament = await Tournament.findById(tournamentId).populate(defaultPopulate).orFail();

                    if (status !== undefined) {
                        const statusResult = await TournamentService.updateStatus(
                            tournament,
                            status,
                            currentUser,
                            req.session,
                        );
                        if (statusResult.error) {
                            return {
                                tournamentId,
                                name: tournament.name,
                                success: false,
                                error: statusResult.error,
                            };
                        }
                    }

                    if (isActive !== undefined) {
                        const activeResult = await TournamentService.updateIsActive(
                            tournament,
                            isActive,
                            currentUser,
                            req.session,
                        );
                        if (activeResult.error) {
                            return {
                                tournamentId,
                                name: tournament.name,
                                success: false,
                                error: activeResult.error,
                            };
                        }
                    }

                    await tournament.save();

                    return {
                        tournamentId,
                        name: tournament.name,
                        success: true,
                    };
                } catch (error) {
                    return {
                        tournamentId,
                        success: false,
                        error: error instanceof Error ? error.message : "Failed to bulk edit tournament",
                    };
                }
            }),
        );

        const successes = results.filter((result) => result.success);
        const failures = results.filter((result) => !result.success);
        const queueStats = await NotificationDispatchService.getQueueStats();

        res.json({
            message: `Bulk edit complete: ${successes.length} succeeded, ${failures.length} failed.`,
            successCount: successes.length,
            failureCount: failures.length,
            results,
            dispatchMode: "queued",
            notificationQueue: queueStats,
        });
    }

    /** POST reassign reviewer */
    public async reassignReviewer(req: Request, res: Response) {
        const tournamentId = req.params.tournamentId;
        const currentUser = res.locals!.user!;

        const { oldReviewerId, newReviewerId } = req.body;

        if (!oldReviewerId || !newReviewerId) {
            return res.status(400).json({ error: "Both old and new reviewer IDs are required" });
        }

        // Find tournament without populating first to check and get a proper reference
        const tournament = await Tournament.findById(tournamentId).orFail();

        if (!tournament.assignedReviewers || tournament.assignedReviewers.length === 0) {
            return res.status(400).json({ error: "Tournament has no assigned reviewers" });
        }

        // Check if old reviewer is actually assigned
        const oldReviewerIndex = tournament.assignedReviewers.findIndex(
            (reviewer) => reviewer.toString() === oldReviewerId,
        );

        if (oldReviewerIndex === -1) {
            return res.status(400).json({ error: "Old reviewer is not assigned to this tournament" });
        }

        // Get and validate new reviewer
        const newReviewer = await User.findById(newReviewerId).orFail();

        // Check if new reviewer has the correct group
        const reviewerTypeMap: { [key in TournamentType]: UserGroup } = {
            tournament: "tc",
            contest: "cc",
        };
        const requiredGroup = reviewerTypeMap[tournament.type];
        if (!newReviewer.groups.includes(requiredGroup)) {
            return res.status(400).json({
                error: `New reviewer must be a member of ${requiredGroup.toUpperCase()}`,
            });
        }

        // Check if new reviewer is already assigned
        if (tournament.assignedReviewers.some((reviewer) => reviewer.toString() === newReviewerId)) {
            return res.status(400).json({ error: "New reviewer is already assigned to this tournament" });
        }

        // Instead of direct array manipulation, use mongoose's array update methods
        // Create a new array with the updated reviewer
        const updatedReviewers = [...tournament.assignedReviewers];
        updatedReviewers[oldReviewerIndex] = newReviewerId;

        // Update the tournament with the new array
        await Tournament.findByIdAndUpdate(
            tournamentId,
            { assignedReviewers: updatedReviewers },
            { new: true, runValidators: true },
        );

        // Update the users' bag
        newReviewer.inBag = false;
        await newReviewer.save();

        const oldReviewer = await User.findById(oldReviewerId).orFail();
        oldReviewer.inBag = true;
        await oldReviewer.save();

        res.json({ message: "Reviewer reassigned successfully!" });

        // logging
        await TournamentService.addTournamentLog(
            tournament,
            currentUser,
            `Reassigned reviewer from [**${oldReviewer.username}**](${oldReviewer.osuProfileUrl}) to [**${newReviewer.username}**](${newReviewer.osuProfileUrl})`,
            "user-pen",
        );

        const now = new Date();
        await Tournament.findByIdAndUpdate(tournamentId, {
            $push: {
                reviewHistory: {
                    $each: [
                        { user: oldReviewer._id, action: "remove", createdAt: now, updatedAt: now },
                        { user: newReviewer._id, action: "assign", createdAt: now, updatedAt: now },
                    ],
                },
            },
        });

        await LogService.generate(
            currentUser.id,
            `Reassigned reviewer for **${tournament.name}** from [**${oldReviewer.username}**](${oldReviewer.osuProfileUrl}) to [**${newReviewer.username}**](${newReviewer.osuProfileUrl})`,
            "tournament",
        );

        // Discord
        const usersToPing = [
            oldReviewer.discordId || oldReviewer.username,
            newReviewer.discordId || newReviewer.username,
        ];
        const embed = new EmbedBuilder()
            .setAuthor(DiscordUtils.defaultWebhookAuthor(req.session))
            .setColor(DiscordUtils.webhookColors.lightOrange)
            .setDescription(
                `Reassigned reviewer for ${tournament.type}: [**${tournament.name}**](${config.baseUrl}/tournaments/${tournament._id})`,
            )
            .addField("Old Reviewer", `[**${oldReviewer.username}**](${oldReviewer.osuProfileUrl})`, true)
            .addField("New Reviewer", `[**${newReviewer.username}**](${newReviewer.osuProfileUrl})`, true);

        const webhookBuilder = new WebhookBuilder()
            .addEmbed(embed)
            .addUsers(usersToPing)
            .setMessage("Tournament Review Reassignment");

        if (tournament.threadId) {
            webhookBuilder.setThreadId(tournament.threadId);
        }

        await webhookBuilder.send();
    }

    /** POST submit review */
    public async submitReview(req: Request, res: Response) {
        const tournamentId = req.params.tournamentId;
        const currentUser = res.locals!.user!;

        const { checklist, comment, vote } = req.body;

        const tournament = await Tournament.findById(tournamentId).populate(defaultPopulate).orFail();

        if (!tournament.isActive) {
            return res.status(400).json({ error: "Tournament is not active" });
        }

        if (!checklist || !checklist.length || !vote) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        if (vote !== "approve" && vote !== "changesRequested" && vote !== "deny") {
            return res.status(400).json({ error: "Invalid vote" });
        }

        if (checklist.some((item) => item.checked === undefined)) {
            return res.status(400).json({ error: "Invalid checklist" });
        }

        let review = tournament.reviews.find((review) => review.author!._id.equals(res.locals!.user!._id));
        let isNewReview = false;

        if (!review) {
            review = new Review({
                author: res.locals!.user!,
                comment,
                vote,
                checklist,
            });
            isNewReview = true;
        } else {
            review.comment = comment;
            review.vote = vote;
            review.checklist = checklist;
        }

        await review.save();

        if (isNewReview) {
            tournament.reviews.push(review);
            await tournament.save();
        }

        res.json({ message: "Review submitted successfully!" });

        if (isNewReview) {
            // logging
            await TournamentService.addTournamentLog(tournament, currentUser, `Submitted review`, "check-to-slot");
            await LogService.generate(currentUser.id, `Submitted review for **${tournament.name}**`, "tournament");
        }

        // Discord
        let color = DiscordUtils.webhookColors.lightBlue;
        if (vote === "changesRequested") color = DiscordUtils.webhookColors.yellow;
        if (vote === "deny") color = DiscordUtils.webhookColors.lightRed;
        if (vote === "approve") color = DiscordUtils.webhookColors.lightGreen;

        let emoji = "❔";
        if (vote === "changesRequested") emoji = "🔄";
        if (vote === "deny") emoji = "❌";
        if (vote === "approve") emoji = "✅";

        // get count of false checklist items, iterate through the review.checklist and count the checked: false items
        const falseCount = review.checklist.filter((item) => !item.checked).length;

        const embed = new EmbedBuilder()
            .setAuthor(DiscordUtils.defaultWebhookAuthor(req.session))
            .setDescription(
                `${isNewReview ? "Submitted a" : "Updated their"} review for ${tournament.type}: [**${
                    tournament.name
                }**](${config.baseUrl}/tournaments/${tournament._id})`,
            )
            .setColor(color)
            .addField("Decision", `${emoji} ${startCase(vote)}`, true)
            .addField("Checklist Issues", `${falseCount > 0 ? "⚠️" : "🎉"} ${falseCount}`, true)
            .addField("Comment", comment.trim().length > 0 ? utils.shorten(comment, 512) : "*No comment provided...*");

        const webhookBuilder = new WebhookBuilder().addEmbed(embed).setNotification("silent");

        if (tournament.threadId) {
            webhookBuilder.setThreadId(tournament.threadId);
        }

        await webhookBuilder.send();
    }

    /** POST upload badges */
    public async uploadBadges(req: Request, res: Response) {
        const tournamentId = req.params.tournamentId;
        const files = req.files as Express.Multer.File[];
        const currentUser = res.locals!.user!;

        const tournament = await Tournament.findById(tournamentId).populate(defaultPopulate).orFail();

        if (!files?.length) {
            return res.status(400).json({ error: "No files uploaded" });
        }

        // Separate valid and invalid files
        const validFiles: Express.Multer.File[] = [];
        const invalidFiles: { file: Express.Multer.File; width: number; height: number }[] = [];

        // Check dimensions of each file
        for (const file of files) {
            try {
                const metadata = await sharp(file.buffer).metadata();
                const width = metadata.width || 0;
                const height = metadata.height || 0;

                if (width !== 172 || height !== 80) {
                    invalidFiles.push({ file, width, height });
                } else {
                    validFiles.push(file);
                }
            } catch (error) {
                // If we can't process the image, treat it as invalid
                invalidFiles.push({ file, width: 0, height: 0 });
            }
        }

        // If there are invalid files, create a note with them
        if (invalidFiles.length > 0) {
            const failedBadgesInfo = invalidFiles
                .map(({ file, width, height }) => {
                    if (width === 0 && height === 0) {
                        return `- **${file.originalname}**: Invalid image file (could not process)`;
                    }
                    return `- **${file.originalname}**: ${width}x${height}px`;
                })
                .join("\n");

            const noteContent = `The following badge uploads failed the dimension requirements:\n\n${failedBadgesInfo}`;

            const note = new Message({
                author: currentUser,
                content: noteContent,
                isCommittee: true,
                isNote: true,
            });

            // Add failed badge files as attachments
            note.attachments = await UploadService.handleFileUploads(
                invalidFiles.map((item) => item.file),
                FILE_UPLOAD_CATEGORY,
                tournament.id,
                currentUser.id,
            );

            await note.save();
            tournament.notes.push(note);

            // logging and Discord notification for failed badges
            await TournamentService.addTournamentLog(
                tournament,
                currentUser,
                `Created note for failed badge uploads`,
                "sticky-note",
            );
            await LogService.generate(
                currentUser.id,
                `Created note for failed badge uploads for **${tournament.name}**`,
                "tournament",
            );

            // Discord notification for failed badges note
            const embed = new EmbedBuilder()
                .setAuthor(DiscordUtils.defaultWebhookAuthor(req.session))
                .setDescription(
                    `Added a note for failed badge uploads for ${tournament.type}: [**${tournament.name}**](${config.baseUrl}/tournaments/${tournament._id})`,
                )
                .setColor(DiscordUtils.webhookColors.yellow)
                .addField("Note", utils.shorten(noteContent, 512));

            if (note.attachments?.length) {
                const attachmentsField = utils.getAttachmentsField(note.attachments)!;
                embed.addField(attachmentsField.name, attachmentsField.value, attachmentsField.inline);
            }

            const webhookBuilder = new WebhookBuilder().addEmbed(embed);

            if (tournament.threadId && tournament.threadId.length > 0) {
                webhookBuilder.setThreadId(tournament.threadId);
            }

            await webhookBuilder.send();
        }

        // Upload only valid badges
        if (validFiles.length > 0) {
            const badges = await UploadService.handleFileUploads(
                validFiles,
                FILE_UPLOAD_CATEGORY,
                tournament.id,
                currentUser.id,
            );

            tournament.badges = badges;

            // logging for successful uploads
            await TournamentService.addTournamentLog(tournament, currentUser, `Uploaded badges`, "image");
            await LogService.generate(currentUser.id, `Uploaded badges for **${tournament.name}**`, "tournament");
        }

        await tournament.save();

        // Determine response message
        let message = "";
        if (validFiles.length > 0 && invalidFiles.length > 0) {
            message = `${validFiles.length} badge(s) uploaded successfully! ${invalidFiles.length} badge(s) failed dimension requirements and were added to notes.`;
        } else if (validFiles.length > 0) {
            message = "Badges uploaded successfully!";
        } else {
            message =
                "No valid badges were uploaded. All badges failed dimension requirements and were added to notes.";
        }

        res.json({ message });
    }

    /** POST download badges */
    public async downloadBadges(req: Request, res: Response) {
        const tournamentId = req.params.tournamentId;
        const tournament = await Tournament.findById(tournamentId).populate(defaultPopulate).orFail();
        const customFilenames = req.body as { badgeId: string; filename: string }[];

        const badges = tournament.badges;

        if (!badges?.length) {
            return res.status(404).json({ error: "No badges found" });
        }

        try {
            // Create a zip file
            const archive = archiver("zip", {
                zlib: { level: 9 }, // Maximum compression
            });

            // Listen for all archive data to be written
            archive.on("error", (err) => {
                throw err;
            });

            // Set the headers for file download
            res.setHeader("Content-Type", "application/zip");

            // Sanitize the tournament name for use in filename
            const { ascii: sanitizedTournamentName } = utils.sanitizeFilename(tournament.name);
            res.setHeader("Content-Disposition", `attachment; filename=${sanitizedTournamentName}_Badges.zip`);

            // Pipe archive data to the response
            archive.pipe(res);

            // Group filenames by badge ID to handle duplicates
            const badgeFilenames = new Map<string, string[]>();
            customFilenames?.forEach(({ badgeId, filename }) => {
                if (!badgeFilenames.has(badgeId)) {
                    badgeFilenames.set(badgeId, []);
                }
                badgeFilenames.get(badgeId)!.push(filename);
            });

            // Track processed badge IDs to avoid duplicates
            const processedBadgeIds = new Set<string>();

            // Process each badge
            for (const badge of badges) {
                try {
                    // Skip if we've already processed this badge
                    if (processedBadgeIds.has(badge._id.toString())) {
                        continue;
                    }
                    processedBadgeIds.add(badge._id.toString());

                    // Download the badge image
                    const response = await axios.get(badge.url, { responseType: "arraybuffer" });
                    const buffer = Buffer.from(response.data);

                    // Get file extension from URL
                    const ext = badge.url.split(".").pop();
                    const filenames = badgeFilenames.get(badge._id.toString()) || [
                        tournament.name.replace(/[^a-z0-9]/gi, "-").toLowerCase(),
                    ];

                    // Use the first filename for this badge
                    const baseFilename = filenames[0];

                    // Add the 2x version (original 172x80)
                    archive.append(buffer, { name: `${baseFilename}@2x.${ext}` });

                    // Create and add the 1x version (86x40)
                    const resizedBuffer = await sharp(buffer)
                        .resize(86, 40, {
                            fit: "fill",
                            withoutEnlargement: true,
                        })
                        .toBuffer();

                    archive.append(resizedBuffer, { name: `${baseFilename}.${ext}` });
                } catch (error) {
                    console.error("Error processing badge:", error);
                    throw new Error("Failed to process badges");
                }
            }

            // Finalize the archive and wait for it to complete
            await archive.finalize();
        } catch (error) {
            console.error("Error creating zip:", error);
            // Only send error if headers haven't been sent
            if (!res.headersSent) {
                res.status(500).json({ error: "Failed to create badge archive" });
            }
        }
    }

    /** POST update thread ID */
    public async updateThreadId(req: Request, res: Response) {
        const tournamentId = req.params.tournamentId;
        const currentUser = res.locals!.user!;

        let threadId = req.body.threadId;

        const tournament = await Tournament.findById(tournamentId).populate(defaultPopulate).orFail();

        threadId = utils.extractDiscordThreadId(threadId);

        if (threadId !== tournament.threadId) {
            tournament.threadId = threadId;
            await tournament.save();

            res.json({ message: "Thread ID updated successfully!" });

            // logging
            await TournamentService.addTournamentLog(
                tournament,
                currentUser,
                `Updated Discord thread ID: **${threadId && threadId.length ? threadId : "#t-committee"}**`,
                "link",
            );
            await LogService.generate(
                currentUser.id,
                `Updated Discord thread ID for **${tournament.name}**`,
                "tournament",
            );

            // discord
            const embed = new EmbedBuilder()
                .setAuthor(DiscordUtils.defaultWebhookAuthor(req.session))
                .setColor(DiscordUtils.webhookColors.white)
                .setDescription(
                    `Updated webhook location for ${tournament.type}: [**${tournament.name}**](${config.baseUrl}/tournaments/${tournament._id})`,
                )
                .addField(
                    "New Location",
                    `<#${threadId && threadId.length ? threadId : config.discord.webhooks.main.channelId}>`,
                );

            const webhookBuilder = new WebhookBuilder().addEmbed(embed);

            if (tournament.threadId && tournament.threadId.length) {
                webhookBuilder.setThreadId(tournament.threadId);
            }

            await webhookBuilder.send();
        } else {
            res.json({ message: "Thread ID is already set!" });
        }
    }

    /** POST create note */
    public async createNote(req: Request, res: Response) {
        const tournamentId = req.params.tournamentId;
        const currentUser = res.locals!.user!;
        const files = req.files as Express.Multer.File[];

        const { content } = req.body;

        const tournament = await Tournament.findById(tournamentId).populate(defaultPopulate).orFail();

        const note = new Message({
            author: currentUser,
            content,
            isCommittee: true,
            isNote: true,
        });

        // Handle file uploads
        if (files?.length) {
            note.attachments = await UploadService.handleFileUploads(
                files,
                FILE_UPLOAD_CATEGORY,
                tournament.id,
                currentUser.id,
            );
        }

        await note.save();

        tournament.notes.push(note);
        await tournament.save();

        res.json({ message: "Note created successfully!" });

        // logging
        await TournamentService.addTournamentLog(tournament, currentUser, `Created note`, "sticky-note");
        await LogService.generate(currentUser.id, `Created note for **${tournament.name}**`, "tournament");

        // Discord
        const embed = new EmbedBuilder()
            .setAuthor(DiscordUtils.defaultWebhookAuthor(req.session))
            .setDescription(
                `Added a note for ${tournament.type}: [**${tournament.name}**](${config.baseUrl}/tournaments/${tournament._id})`,
            )
            .setColor(DiscordUtils.webhookColors.blue)
            .addField("Note", utils.shorten(content, 512));

        if (note.attachments?.length) {
            const attachmentsField = utils.getAttachmentsField(note.attachments)!;
            embed.addField(attachmentsField.name, attachmentsField.value, attachmentsField.inline);
        }

        const webhookBuilder = new WebhookBuilder().addEmbed(embed);

        if (tournament.threadId && tournament.threadId.length > 0) {
            webhookBuilder.setThreadId(tournament.threadId);
        }

        await webhookBuilder.send();
    }

    /** POST delete tournament */
    public async delete(req: Request, res: Response) {
        const tournamentId = req.params.tournamentId;

        const tournament = await Tournament.findById(tournamentId).orFail();

        if (tournament.status !== "supportRequestReceived") {
            return res
                .status(400)
                .json({ error: "Cannot delete tournament that isn't in support request received status!" });
        }

        await Tournament.findByIdAndDelete(tournamentId);

        res.json({ message: "Tournament deleted successfully!" });
    }
}

export default new TournamentsController();
