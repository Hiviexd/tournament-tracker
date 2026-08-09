import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
} from "@nestjs/common";
import type { Response } from "express";
import type { Session } from "express-session";
import { Types } from "mongoose";
import Tournament from "@tc/models/tournamentModel";
import UserService from "@tc/osu/UserService";
import {
    TournamentQueryParams,
    TournamentType,
    TournamentStatus,
    GameMode,
    ITournament,
    ITournamentExtraLink,
} from "@tc/types/Tournament";
import { IUser, UserGroup } from "@tc/types/User";
import User from "@tc/models/userModel";
import UploadService from "../../services/UploadService";
import Review from "@tc/models/reviewModel";
import sharp from "sharp";
import archiver from "archiver";
import axios from "axios";
import { TournamentService } from "../../services/TournamentService";
import LogService from "@tc/models/LogService";
import NotificationDispatchService from "@tc/notifications/NotificationDispatchService";
import capitalize from "lodash/capitalize.js";
import startCase from "lodash/startCase.js";
import dayjs from "@tc/utils/dayjs";
import { EmbedBuilder } from "@tc/notifications/discord/EmbedBuilder";
import { WebhookBuilder } from "@tc/notifications/discord/WebhookBuilder";
import DiscordUtils from "@tc/notifications/discord/DiscordUtils";
import config from "@tc/config";
import Message from "@tc/models/messageModel";
import utils from "@tc/utils/server";

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
    session: Session;
}

interface TournamentEditField {
    isSet: (body: Record<string, unknown>) => boolean;
    archivedAllowed: boolean;
    hostAllowed: boolean;
    errorStatus: 400 | 403;
    run: (ctx: TournamentEditContext) => Promise<{ error?: string }>;
}

function buildEditFields(tournamentService: TournamentService): TournamentEditField[] {
    return [
        {
            isSet: (body) => body.name !== undefined,
            archivedAllowed: true,
            hostAllowed: false,
            errorStatus: 400,
            run: ({ tournament, body, currentUser }) =>
                tournamentService.updateName(tournament, body.name as string, currentUser),
        },
        {
            isSet: (body) => body.hostIds !== undefined,
            archivedAllowed: true,
            hostAllowed: false,
            errorStatus: 400,
            run: ({ tournament, body, currentUser }) =>
                tournamentService.updateHosts(tournament, body.hostIds as string[], currentUser),
        },
        {
            isSet: (body) => body.modes !== undefined,
            archivedAllowed: true,
            hostAllowed: false,
            errorStatus: 403,
            run: ({ tournament, body, currentUser }) =>
                tournamentService.updateModes(tournament, body.modes as ITournament["modes"], currentUser),
        },
        {
            isSet: (body) => body.type !== undefined,
            archivedAllowed: true,
            hostAllowed: false,
            errorStatus: 403,
            run: ({ tournament, body, currentUser }) =>
                tournamentService.updateType(tournament, body.type as ITournament["type"], currentUser),
        },
        {
            isSet: (body) => body.forumUrl !== undefined,
            archivedAllowed: false,
            hostAllowed: false,
            errorStatus: 400,
            run: ({ tournament, body, currentUser }) =>
                tournamentService.updateForumUrl(tournament, body.forumUrl as string, currentUser),
        },
        {
            isSet: (body) => body.extraLinks !== undefined,
            archivedAllowed: true,
            hostAllowed: false,
            errorStatus: 400,
            run: ({ tournament, body, currentUser }) =>
                tournamentService.updateExtraLinks(tournament, body.extraLinks as ITournamentExtraLink[], currentUser),
        },
        {
            isSet: (body) => body.enchantUrl !== undefined,
            archivedAllowed: false,
            hostAllowed: false,
            errorStatus: 400,
            run: ({ tournament, body, currentUser }) =>
                tournamentService.updateEnchantUrl(tournament, body.enchantUrl as string, currentUser),
        },
        {
            isSet: (body) => body.startDate != null && body.endDate != null,
            archivedAllowed: false,
            hostAllowed: false,
            errorStatus: 400,
            run: ({ tournament, body, currentUser }) =>
                tournamentService.updateDates(tournament, body.startDate as Date, body.endDate as Date, currentUser),
        },
        {
            isSet: (body) => body.tags !== undefined,
            archivedAllowed: true,
            hostAllowed: false,
            errorStatus: 400,
            run: ({ tournament, body, actioner }) =>
                tournamentService.updateTags(tournament, body.tags as string[], actioner),
        },
        {
            isSet: (body) => typeof body.bannerUrl === "string",
            archivedAllowed: true,
            hostAllowed: true,
            errorStatus: 400,
            run: ({ tournament, body, actioner }) =>
                tournamentService.updateBanner(tournament, body.bannerUrl as string, actioner),
        },
        {
            isSet: (body) => body.winners !== undefined,
            archivedAllowed: true,
            hostAllowed: false,
            errorStatus: 400,
            run: ({ tournament, body, currentUser }) =>
                tournamentService.updateWinners(tournament, body.winners as IUser[], currentUser),
        },
        {
            isSet: (body) => body.status !== undefined,
            archivedAllowed: false,
            hostAllowed: false,
            errorStatus: 400,
            run: ({ tournament, body, currentUser, session }) =>
                tournamentService.updateStatus(tournament, body.status as ITournament["status"], currentUser, session),
        },
        {
            isSet: (body) => body.isActive !== undefined,
            archivedAllowed: true,
            hostAllowed: false,
            errorStatus: 400,
            run: ({ tournament, body, currentUser, session }) =>
                tournamentService.updateIsActive(tournament, body.isActive as boolean, currentUser, session),
        },
    ];
}

function hasArchivedAllowedEdit(fields: TournamentEditField[], body: Record<string, unknown>): boolean {
    return fields.some((field) => field.archivedAllowed && field.isSet(body));
}

function hasNonHostEdit(fields: TournamentEditField[], body: Record<string, unknown>): boolean {
    return fields.some((field) => field.isSet(body) && !field.hostAllowed);
}

const selectFields = (isCommittee: boolean) =>
    isCommittee ? "" : "-assignedReviewers -notes -logs -threadId -enchantUrl";

function throwEditError(status: 400 | 403, error: string): never {
    if (status === 403) throw new ForbiddenException(error);
    throw new BadRequestException(error);
}

@Injectable()
export class TournamentsService {
    private readonly editFields: TournamentEditField[];

    constructor(private readonly tournamentService: TournamentService) {
        this.editFields = buildEditFields(tournamentService);
    }

    async index(
        queryParams: {
            search?: string;
            mode?: string;
            host?: string;
            type?: string;
            status?: string;
            state?: string;
            showAllAssignedReviews?: string;
            page?: string | number;
        },
        user: IUser | undefined,
    ) {
        const { search, mode, host, type, status, state, showAllAssignedReviews, page = 1 } = queryParams;
        const query: TournamentQueryParams = {};

        if (search) {
            const searchQuery = this.tournamentService.createSearchQuery(search);
            if (searchQuery.$and) {
                query.$and = searchQuery.$and;
            }
        }
        if (mode) query.modes = { $in: [mode as GameMode] };
        if (host) {
            const hostUser = await User.findByUsernameOrOsuId(host);
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
                        needsUserReview: {
                            $cond: {
                                if: {
                                    $and: [
                                        { $in: [user?._id, { $ifNull: ["$assignedReviewers", []] }] },
                                        {
                                            $in: ["$status", ["reviewOngoing", "changesRequested"]],
                                        },
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
                        needsUserReview: -1,
                        isActive: -1,
                        statusOrder: 1,
                        createdAt: -1,
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
                        this.tournamentService.sanitizeTournamentListing(Tournament.hydrate(t).toJSON(), user),
                    ),
                ),
            Tournament.countDocuments(query),
        ]);

        return {
            tournaments,
            total,
            page: Number(page),
            pages: Math.ceil(total / DEFAULT_LIMIT),
        };
    }

    async getTournament(tournamentId: string, user: IUser | undefined) {
        const isCommitteeOrAdmin = !!user && user.isCommitteeOrAdmin;

        let tournament = await Tournament.findById(tournamentId)
            .select(selectFields(isCommitteeOrAdmin))
            .populate(defaultPopulate)
            .orFail();

        tournament = this.tournamentService.censorTournamentData(tournament, user);

        if (isCommitteeOrAdmin) {
            const [reports, votings] = await Promise.all([
                this.tournamentService.getRelatedReports(tournament),
                this.tournamentService.getRelatedVotings(tournament),
            ]);
            return { tournament, reports, votings };
        }

        return { tournament };
    }

    async create(body: Record<string, any>, currentUser: IUser, session: Session) {
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
        } = body;

        const hostIdArray = Array.isArray(hostIds) ? hostIds : hostIds ? [hostIds] : [];

        if (hostIdArray.length === 0) {
            throw new BadRequestException("At least one host is required");
        }

        const hostsUnordered = await User.find({ _id: { $in: hostIdArray } });

        if (hostsUnordered.length !== hostIdArray.length) {
            throw new BadRequestException("One or more host IDs are invalid");
        }

        const hosts = hostIdArray
            .map((id: string) => hostsUnordered.find((host) => host._id.toString() === id))
            .filter((host) => host !== undefined) as typeof hostsUnordered;

        const status: TournamentStatus = "supportRequestReceived";

        if (forumUrl && !utils.isOsuForumLink(forumUrl)) {
            throw new BadRequestException("Invalid osu! forum URL format");
        }

        if (enchantUrl && !utils.isEnchantTicketLink(enchantUrl)) {
            throw new BadRequestException("Invalid Enchant ticket URL format");
        }

        if (bannerUrl && !utils.isValidUrl(bannerUrl)) {
            throw new BadRequestException("Banner URL must be a valid URL");
        }

        if (name && !utils.isLatinScriptOnly(name)) {
            throw new BadRequestException("Name must be in Latin script (no Cyrillic, Chinese, etc.)");
        }

        let normalizedExtraLinks: ITournamentExtraLink[] = [];
        if (extraLinks !== undefined) {
            const extraLinksError = utils.validateExtraLinks(extraLinks);
            if (extraLinksError) {
                throw new BadRequestException(extraLinksError);
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
                throw new BadRequestException("Winners must be an array");
            }
            winnerIds = winners.map((w: IUser | string) =>
                typeof w === "string" ? w : ((w as IUser)._id?.toString?.() ?? (w as IUser).id),
            );
            if (winnerIds.some((id) => !id)) {
                throw new BadRequestException("One or more winner IDs are invalid");
            }
            if (winnerIds.length > 0) {
                const foundWinners = await User.find({ _id: { $in: winnerIds } });
                if (foundWinners.length !== winnerIds.length) {
                    throw new BadRequestException("One or more winner IDs are invalid");
                }
            }
        }

        const hostsWithInfringements = hosts.filter((host) => host.activeInfringement);
        if (hostsWithInfringements.length > 0) {
            const hostnames = hostsWithInfringements.map((host) => host.username).join(", ");
            throw new BadRequestException(
                `Cannot create tournament with hosts that have active infringements: ${hostnames}`,
            );
        }

        const lowerCaseTags = tags?.map((tag: string) => tag.toLowerCase());
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

        await LogService.generate(currentUser.id, `Created ${tournament.type}: **${tournament.name}**`, "tournament");
        await this.tournamentService.addTournamentLog(
            tournament,
            currentUser,
            `Created ${tournament.type}`,
            tournament.isTournament ? "trophy" : "award",
        );

        const hostsList = utils.formatHostsList(hosts, { mdLinks: true });
        const embed = new EmbedBuilder()
            .setAuthor(DiscordUtils.defaultWebhookAuthor(session))
            .setColor(DiscordUtils.webhookColors.green)
            .setDescription(
                `Created a new ${tournament.type}: [**${tournament.name}**](${config.baseUrl}/tournaments/${tournament._id})`,
            )
            .addField(hosts.length === 1 ? "Host" : "Hosts", hostsList)
            .addField("Start Date", dayjs(tournament.startDate).format("YYYY-MM-DD"), true)
            .addField("End Date", dayjs(tournament.endDate).format("YYYY-MM-DD"), true)
            .addField(
                utils.formatCount(tournament.modes.length, "Mode", { includeCount: false }),
                tournament.modes.map((mode) => utils.getDiscordEmoji(mode)).join(" "),
                true,
            )
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

        return { message: "Tournament created successfully!", tournament };
    }

    async assignReviewers(tournamentId: string, currentUser: IUser, session: Session) {
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

        await this.tournamentService.addTournamentLog(
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

        const usersToPing = reviewers.map((r) => r.discordId || r.username);

        const embed = new EmbedBuilder()
            .setAuthor(DiscordUtils.defaultWebhookAuthor(session))
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

        return { message: "Reviewers assigned successfully!" };
    }

    async addReviewer(tournamentId: string, reviewerId: string | undefined, currentUser: IUser, session: Session) {
        if (!reviewerId) {
            throw new BadRequestException("reviewerId is required");
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
            throw new BadRequestException("User not found");
        }
        if (!user.groups.includes(requiredGroup)) {
            throw new BadRequestException(`${user.username} is not a member of ${requiredGroup.toUpperCase()}`);
        }
        if (usersToExclude.includes(reviewerId)) {
            throw new BadRequestException(`${user.username} is already assigned or excluded`);
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

        await this.tournamentService.addTournamentLog(
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
            .setAuthor(DiscordUtils.defaultWebhookAuthor(session))
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

        return { message: "Reviewer added successfully!" };
    }

    async removeReviewer(tournamentId: string, reviewerId: string | undefined, currentUser: IUser, session: Session) {
        if (!reviewerId) {
            throw new BadRequestException("reviewerId is required");
        }

        const tournament = await Tournament.findById(tournamentId).orFail();

        if (!tournament.assignedReviewers || tournament.assignedReviewers.length === 0) {
            throw new BadRequestException("Tournament has no assigned reviewers");
        }

        const index = tournament.assignedReviewers.findIndex((r: any) => r.toString() === reviewerId);
        if (index === -1) {
            throw new BadRequestException("Reviewer is not assigned to this tournament");
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

        await this.tournamentService.addTournamentLog(
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
            .setAuthor(DiscordUtils.defaultWebhookAuthor(session))
            .setColor(DiscordUtils.webhookColors.red)
            .setDescription(
                `Removed reviewer from ${tournament.type}: [**${tournament.name}**](${config.baseUrl}/tournaments/${tournament._id})`,
            )
            .addField("Removed", `[**${removedUser.username}**](${removedUser.osuProfileUrl})`);
        const webhookBuilder = new WebhookBuilder().addEmbed(embed);
        if (tournament.threadId) webhookBuilder.setThreadId(tournament.threadId);
        await webhookBuilder.send();

        return { message: "Reviewer removed successfully!" };
    }

    async edit(tournamentId: string, body: Record<string, unknown>, currentUser: IUser, session: Session) {
        const tournament = await Tournament.findById(tournamentId).populate(defaultPopulate).orFail();

        if (!tournament.isActive && !hasArchivedAllowedEdit(this.editFields, body)) {
            throw new BadRequestException("Cannot edit archived tournament!");
        }

        let actioner = currentUser;
        const isHost = tournament.hosts?.some((host) => host._id.equals(currentUser._id));

        if (!currentUser.isCommitteeOrAdmin && !isHost) {
            throw new ForbiddenException("Unauthorized");
        }

        if (!currentUser.isCommittee && isHost) {
            actioner = tournament.hosts.find((host) => host._id.equals(currentUser._id)) || currentUser;

            if (hasNonHostEdit(this.editFields, body)) {
                throw new ForbiddenException("Hosts can only edit banner!");
            }
        }

        for (const field of this.editFields) {
            if (!field.isSet(body)) continue;

            const result = await field.run({
                tournament,
                body,
                currentUser,
                actioner,
                session,
            });

            if (result.error) {
                throwEditError(field.errorStatus, result.error);
            }
        }

        await tournament.save();

        return { message: "Tournament updated successfully!" };
    }

    async bulkEdit(
        body: {
            tournamentIds?: string[];
            status?: TournamentStatus;
            isActive?: boolean;
        },
        currentUser: IUser,
        session: Session,
    ) {
        const { tournamentIds, status, isActive } = body;

        if (!Array.isArray(tournamentIds) || tournamentIds.length === 0) {
            throw new BadRequestException("tournamentIds must be a non-empty array");
        }

        if (status === undefined && isActive === undefined) {
            throw new BadRequestException("At least one field (status or isActive) is required");
        }

        const uniqueTournamentIds = Array.from(new Set(tournamentIds));
        const results = await Promise.all(
            uniqueTournamentIds.map(async (tournamentId) => {
                try {
                    const tournament = await Tournament.findById(tournamentId).populate(defaultPopulate).orFail();

                    if (status !== undefined) {
                        const statusResult = await this.tournamentService.updateStatus(
                            tournament,
                            status,
                            currentUser,
                            session,
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
                        const activeResult = await this.tournamentService.updateIsActive(
                            tournament,
                            isActive,
                            currentUser,
                            session,
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

        return {
            message: `Bulk edit complete: ${successes.length} succeeded, ${failures.length} failed.`,
            successCount: successes.length,
            failureCount: failures.length,
            results,
            dispatchMode: "queued",
            notificationQueue: queueStats,
        };
    }

    async reassignReviewer(
        tournamentId: string,
        body: { oldReviewerId?: string; newReviewerId?: string },
        currentUser: IUser,
        session: Session,
    ) {
        const { oldReviewerId, newReviewerId } = body;

        if (!oldReviewerId || !newReviewerId) {
            throw new BadRequestException("Both old and new reviewer IDs are required");
        }

        const tournament = await Tournament.findById(tournamentId).orFail();

        if (!tournament.assignedReviewers || tournament.assignedReviewers.length === 0) {
            throw new BadRequestException("Tournament has no assigned reviewers");
        }

        const oldReviewerIndex = tournament.assignedReviewers.findIndex(
            (reviewer) => reviewer.toString() === oldReviewerId,
        );

        if (oldReviewerIndex === -1) {
            throw new BadRequestException("Old reviewer is not assigned to this tournament");
        }

        const newReviewer = await User.findById(newReviewerId).orFail();

        const reviewerTypeMap: { [key in TournamentType]: UserGroup } = {
            tournament: "tc",
            contest: "cc",
        };
        const requiredGroup = reviewerTypeMap[tournament.type];
        if (!newReviewer.groups.includes(requiredGroup)) {
            throw new BadRequestException(`New reviewer must be a member of ${requiredGroup.toUpperCase()}`);
        }

        if (tournament.assignedReviewers.some((reviewer) => reviewer.toString() === newReviewerId)) {
            throw new BadRequestException("New reviewer is already assigned to this tournament");
        }

        const updatedReviewers = [...tournament.assignedReviewers];
        updatedReviewers[oldReviewerIndex] = newReviewerId as any;

        await Tournament.findByIdAndUpdate(
            tournamentId,
            { assignedReviewers: updatedReviewers },
            { new: true, runValidators: true },
        );

        newReviewer.inBag = false;
        await newReviewer.save();

        const oldReviewer = await User.findById(oldReviewerId).orFail();
        oldReviewer.inBag = true;
        await oldReviewer.save();

        await this.tournamentService.addTournamentLog(
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

        const usersToPing = [
            oldReviewer.discordId || oldReviewer.username,
            newReviewer.discordId || newReviewer.username,
        ];
        const embed = new EmbedBuilder()
            .setAuthor(DiscordUtils.defaultWebhookAuthor(session))
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

        return { message: "Reviewer reassigned successfully!" };
    }

    async submitReview(
        tournamentId: string,
        body: { checklist?: any[]; comment?: string; vote?: string },
        currentUser: IUser,
        session: Session,
    ) {
        const { checklist, comment, vote } = body;

        const tournament = await Tournament.findById(tournamentId).populate(defaultPopulate).orFail();

        if (!tournament.isActive) {
            throw new BadRequestException("Tournament is not active");
        }

        if (!checklist || !checklist.length || !vote) {
            throw new BadRequestException("Missing required fields");
        }

        if (vote !== "approve" && vote !== "changesRequested" && vote !== "deny") {
            throw new BadRequestException("Invalid vote");
        }

        if (checklist.some((item) => item.checked === undefined)) {
            throw new BadRequestException("Invalid checklist");
        }

        let review = tournament.reviews.find((review) => review.author!._id.equals(currentUser._id));
        let isNewReview = false;

        if (!review) {
            review = new Review({
                author: currentUser,
                comment: comment ?? "",
                vote,
                checklist,
            });
            isNewReview = true;
        } else {
            review.comment = comment ?? "";
            review.vote = vote;
            review.checklist = checklist;
        }

        await review.save();

        if (isNewReview) {
            tournament.reviews.push(review);
            await tournament.save();
        }

        if (isNewReview) {
            await this.tournamentService.addTournamentLog(tournament, currentUser, `Submitted review`, "check-to-slot");
            await LogService.generate(currentUser.id, `Submitted review for **${tournament.name}**`, "tournament");
        }

        let color = DiscordUtils.webhookColors.lightBlue;
        if (vote === "changesRequested") color = DiscordUtils.webhookColors.yellow;
        if (vote === "deny") color = DiscordUtils.webhookColors.lightRed;
        if (vote === "approve") color = DiscordUtils.webhookColors.lightGreen;

        let emoji = "❔";
        if (vote === "changesRequested") emoji = "🔄";
        if (vote === "deny") emoji = "❌";
        if (vote === "approve") emoji = "✅";

        const falseCount = review.checklist.filter((item) => !item.checked).length;

        const embed = new EmbedBuilder()
            .setAuthor(DiscordUtils.defaultWebhookAuthor(session))
            .setDescription(
                `${isNewReview ? "Submitted a" : "Updated their"} review for ${tournament.type}: [**${
                    tournament.name
                }**](${config.baseUrl}/tournaments/${tournament._id})`,
            )
            .setColor(color)
            .addField("Decision", `${emoji} ${startCase(vote)}`, true)
            .addField("Checklist Issues", `${falseCount > 0 ? "⚠️" : "🎉"} ${falseCount}`, true)
            .addField("Comment", comment!.trim().length > 0 ? utils.shorten(comment!, 512) : "*No comment provided...*");

        const webhookBuilder = new WebhookBuilder().addEmbed(embed).setNotification("silent");

        if (tournament.threadId) {
            webhookBuilder.setThreadId(tournament.threadId);
        }

        await webhookBuilder.send();

        return { message: "Review submitted successfully!" };
    }

    async uploadBadges(
        tournamentId: string,
        files: Express.Multer.File[] | undefined,
        currentUser: IUser,
        session: Session,
    ) {
        const tournament = await Tournament.findById(tournamentId).populate(defaultPopulate).orFail();

        if (!files?.length) {
            throw new BadRequestException("No files uploaded");
        }

        const validFiles: Express.Multer.File[] = [];
        const invalidFiles: { file: Express.Multer.File; width: number; height: number }[] = [];

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
            } catch {
                invalidFiles.push({ file, width: 0, height: 0 });
            }
        }

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

            note.attachments = await UploadService.handleFileUploads(
                invalidFiles.map((item) => item.file),
                FILE_UPLOAD_CATEGORY,
                tournament.id,
                currentUser.id,
            );

            await note.save();
            tournament.notes.push(note);

            await this.tournamentService.addTournamentLog(
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

            const embed = new EmbedBuilder()
                .setAuthor(DiscordUtils.defaultWebhookAuthor(session))
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

        if (validFiles.length > 0) {
            const badges = await UploadService.handleFileUploads(
                validFiles,
                FILE_UPLOAD_CATEGORY,
                tournament.id,
                currentUser.id,
            );

            tournament.badges = badges;

            await this.tournamentService.addTournamentLog(tournament, currentUser, `Uploaded badges`, "image");
            await LogService.generate(currentUser.id, `Uploaded badges for **${tournament.name}**`, "tournament");
        }

        await tournament.save();

        let message = "";
        if (validFiles.length > 0 && invalidFiles.length > 0) {
            message = `${validFiles.length} badge(s) uploaded successfully! ${invalidFiles.length} badge(s) failed dimension requirements and were added to notes.`;
        } else if (validFiles.length > 0) {
            message = "Badges uploaded successfully!";
        } else {
            message =
                "No valid badges were uploaded. All badges failed dimension requirements and were added to notes.";
        }

        return { message };
    }

    async downloadBadges(
        tournamentId: string,
        customFilenames: { badgeId: string; filename: string }[] | undefined,
        res: Response,
    ) {
        const tournament = await Tournament.findById(tournamentId).populate(defaultPopulate).orFail();
        const badges = tournament.badges;

        if (!badges?.length) {
            throw new NotFoundException("No badges found");
        }

        try {
            const archive = archiver("zip", {
                zlib: { level: 9 },
            });

            archive.on("error", (err) => {
                throw err;
            });

            res.setHeader("Content-Type", "application/zip");

            const { ascii: sanitizedTournamentName } = utils.sanitizeFilename(tournament.name);
            res.setHeader("Content-Disposition", `attachment; filename=${sanitizedTournamentName}_Badges.zip`);

            archive.pipe(res);

            const badgeFilenames = new Map<string, string[]>();
            customFilenames?.forEach(({ badgeId, filename }) => {
                if (!badgeFilenames.has(badgeId)) {
                    badgeFilenames.set(badgeId, []);
                }
                badgeFilenames.get(badgeId)!.push(filename);
            });

            const processedBadgeIds = new Set<string>();

            for (const badge of badges) {
                try {
                    if (processedBadgeIds.has(badge._id.toString())) {
                        continue;
                    }
                    processedBadgeIds.add(badge._id.toString());

                    const response = await axios.get(badge.url, { responseType: "arraybuffer" });
                    const buffer = Buffer.from(response.data);

                    const ext = badge.url.split(".").pop();
                    const filenames = badgeFilenames.get(badge._id.toString()) || [
                        tournament.name.replace(/[^a-z0-9]/gi, "-").toLowerCase(),
                    ];

                    const baseFilename = filenames[0];

                    archive.append(buffer, { name: `${baseFilename}@2x.${ext}` });

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

            await archive.finalize();
        } catch (error) {
            console.error("Error creating zip:", error);
            if (!res.headersSent) {
                throw new InternalServerErrorException("Failed to create badge archive");
            }
        }
    }

    async updateThreadId(tournamentId: string, threadIdInput: string | undefined, currentUser: IUser, session: Session) {
        let threadId = threadIdInput;

        const tournament = await Tournament.findById(tournamentId).populate(defaultPopulate).orFail();

        threadId = utils.extractDiscordThreadId(threadId ?? null) ?? undefined;

        if (threadId !== tournament.threadId) {
            tournament.threadId = threadId;
            await tournament.save();

            await this.tournamentService.addTournamentLog(
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

            const embed = new EmbedBuilder()
                .setAuthor(DiscordUtils.defaultWebhookAuthor(session))
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

            return { message: "Thread ID updated successfully!" };
        }

        return { message: "Thread ID is already set!" };
    }

    async createNote(
        tournamentId: string,
        content: string | undefined,
        files: Express.Multer.File[] | undefined,
        currentUser: IUser,
        session: Session,
    ) {
        const tournament = await Tournament.findById(tournamentId).populate(defaultPopulate).orFail();

        const note = new Message({
            author: currentUser,
            content,
            isCommittee: true,
            isNote: true,
        });

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

        await this.tournamentService.addTournamentLog(tournament, currentUser, `Created note`, "sticky-note");
        await LogService.generate(currentUser.id, `Created note for **${tournament.name}**`, "tournament");

        const embed = new EmbedBuilder()
            .setAuthor(DiscordUtils.defaultWebhookAuthor(session))
            .setDescription(
                `Added a note for ${tournament.type}: [**${tournament.name}**](${config.baseUrl}/tournaments/${tournament._id})`,
            )
            .setColor(DiscordUtils.webhookColors.blue)
            .addField("Note", utils.shorten(content ?? "", 512));

        if (note.attachments?.length) {
            const attachmentsField = utils.getAttachmentsField(note.attachments)!;
            embed.addField(attachmentsField.name, attachmentsField.value, attachmentsField.inline);
        }

        const webhookBuilder = new WebhookBuilder().addEmbed(embed);

        if (tournament.threadId && tournament.threadId.length > 0) {
            webhookBuilder.setThreadId(tournament.threadId);
        }

        await webhookBuilder.send();

        return { message: "Note created successfully!" };
    }

    async delete(tournamentId: string) {
        const tournament = await Tournament.findById(tournamentId).orFail();

        if (tournament.status !== "supportRequestReceived") {
            throw new BadRequestException(
                "Cannot delete tournament that isn't in support request received status!",
            );
        }

        await Tournament.findByIdAndDelete(tournamentId);

        return { message: "Tournament deleted successfully!" };
    }
}
