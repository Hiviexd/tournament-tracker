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
import _ from "lodash";
import moment from "moment";
import DiscordService from "../services/DiscordService";
import webhookColors from "../constants/webhookColors";
import config from "../../config.json";
import Message from "../models/messageModel";
import OsuBotService from "../services/OsuBotService";
import utils from "../../utils";
import { IDiscordField } from "../../interfaces/Discord";
import { ITicket } from "../../interfaces/Ticket";
import { IVoting } from "../../interfaces/Voting";
import { InfringementType } from "../../interfaces/User";

const defaultPopulate = [
    {
        path: "host",
        select: "username osuId groups coverUrl country infringements",
    },
    {
        path: "assignedReviewers",
        select: "username osuId groups coverUrl isActiveReviewer country",
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
        select: "username osuId groups coverUrl country infringements",
    },
];

const DEFAULT_LIMIT = 30;

const FILE_UPLOAD_CATEGORY = "tournaments";

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
            if (hostUser) query.host = hostUser._id;
        }
        if (type) query.type = type as TournamentType;
        if (status) query.status = status as TournamentStatus;

        if (state === "archived" || state === "concluded") {
            // Show only archived tournaments
            query.isActive = false;
        } else if (state === "all" || state === "active") {
            // "all" = show both active and archived, "active" = backward compatibility
            if (state === "active") {
                // Handle old "active" parameter for backward compatibility
                query.isActive = true;
            }
            // For "all", don't add isActive filter to show both
        } else {
            // Default behavior: show only active tournaments
            query.isActive = true;
        }

        // if search or host is not empty, remove query.isActive; we want to show all tournaments
        if (search || host) delete query.isActive;

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
                        TournamentService.sanitizeTournamentListing(Tournament.hydrate(t).toJSON(), user)
                    )
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

        tournament = TournamentService.censorTournamentReviews(tournament, res.locals!.user);

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
        const { name, hostId, modes, type, forumUrl, startDate, endDate, bannerUrl, enchantUrl, tags } = req.body;
        const currentUser = res.locals!.user!;

        const host = await User.findById(hostId).orFail();

        const status: TournamentStatus = "supportRequestReceived";

        if (forumUrl && !utils.isOsuForumLink(forumUrl)) {
            return res.status(400).json({ error: "Invalid osu! forum URL format" });
        }

        if (enchantUrl && !utils.isEnchantTicketLink(enchantUrl)) {
            return res.status(400).json({ error: "Invalid Enchant ticket URL format" });
        }

        if (name && !utils.isLatinScriptOnly(name)) {
            return res.status(400).json({ error: "Name must be in Latin script (no Cyrillic, Chinese, etc.)" });
        }

        const lowerCaseTags = tags?.map((tag: string) => tag.toLowerCase());

        const tournament = new Tournament({
            name,
            host,
            modes,
            type,
            status,
            forumUrl,
            startDate,
            endDate,
            bannerUrl,
            enchantUrl,
            tags: lowerCaseTags,
        });

        await tournament.save();

        res.json({ message: "Tournament created successfully!", tournament });

        // logging
        await LogService.generate(currentUser.id, `Created ${tournament.type}: **${tournament.name}**`, "tournament");
        await TournamentService.addTournamentLog(
            tournament,
            currentUser,
            `Created ${tournament.type}`,
            tournament.isTournament ? "trophy" : "award"
        );

        // Discord
        const embed = {
            author: DiscordService.defaultWebhookAuthor(req.session),
            color: webhookColors.green,
            description: `Created a new ${tournament.type}: [**${tournament.name}**](${config.baseUrl}/tournaments/${tournament._id})`,
            fields: [
                {
                    name: "Host",
                    value: `[**${host.username}**](${host.osuProfileUrl})`,
                    inline: true,
                },
                {
                    name: "Start Date",
                    value: moment(tournament.startDate).format("YYYY-MM-DD"),
                    inline: true,
                },
                {
                    name: "End Date",
                    value: moment(tournament.endDate).format("YYYY-MM-DD"),
                    inline: true,
                },
                {
                    name: "Game Mode",
                    value: tournament.modes.map((mode) => utils.formatGameMode(mode)).join(", "),
                    inline: true,
                },
                {
                    name: "Forum URL",
                    value: tournament.forumUrl.length ? tournament.forumUrl : "*None*",
                },
                {
                    name: "Search Tags",
                    value:
                        tournament.tags && tournament.tags.length
                            ? tournament.tags.map((tag) => `\`${tag}\``).join(", ")
                            : "*None*",
                },
            ],
            image: {
                url: tournament.bannerUrl || "",
            },
        };

        await DiscordService.sendWebhook({
            embeds: [embed],
        });
    }

    /** POST assign reviewers */
    public async assignReviewers(req: Request, res: Response) {
        const tournamentId = req.params.tournamentId;
        const currentUser = res.locals!.user!;

        const tournament = await Tournament.findById(tournamentId).populate("host winners").orFail();

        const reviewerTypeMap: { [key in TournamentType]: UserGroup } = {
            tournament: "tc",
            contest: "cc",
        };

        const assignedReviewersType = reviewerTypeMap[tournament.type];

        const usersToExclude: string[] = [];

        if (tournament.host) {
            usersToExclude.push(tournament.host._id.toString());
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

        await tournament.save();

        res.json({ message: "Reviewers assigned successfully!" });

        // logging
        await TournamentService.addTournamentLog(
            tournament,
            currentUser,
            `Assigned reviewers: ${reviewers.map((r) => `[**${r.username}**](${r.osuProfileUrl})`).join(", ")}`,
            "users"
        );

        await LogService.generate(
            currentUser.id,
            `Assigned reviewers to **${tournament.name}**: ${reviewers
                .map((r) => `[**${r.username}**](${r.osuProfileUrl})`)
                .join(", ")}`,
            "tournament"
        );

        // Discord
        const usersToPing = reviewers.map((r) => r.discordId || r.username);

        const embed = {
            author: DiscordService.defaultWebhookAuthor(req.session),
            color: webhookColors.orange,
            description: `Assigned reviewers to ${tournament.type}: [**${tournament.name}**](${config.baseUrl}/tournaments/${tournament._id})`,
            fields: [
                {
                    name: "Reviewers",
                    value: reviewers.map((r) => `[**${r.username}**](${r.osuProfileUrl})`).join(", "),
                },
            ],
        };

        await DiscordService.sendUserHighlightWebhook({
            users: usersToPing,
            embeds: [embed],
            message: `New ${_.capitalize(tournament.type)} Review`,
            threadId: tournament.threadId,
        });
    }

    /** POST edit tournament */
    public async edit(req: Request, res: Response) {
        const tournamentId = req.params.tournamentId;
        const currentUser = res.locals!.user!;

        const { forumUrl, startDate, endDate, status, isActive, bannerUrl, winners, enchantUrl, tags } = req.body;

        const tournament = await Tournament.findById(tournamentId).populate(defaultPopulate).orFail();

        const oldStatus = tournament.status;

        // only allow editing the following if tournament is inactive:
        // - banner
        // - tags
        if (!tournament.isActive && isActive === undefined && !bannerUrl && !tags) {
            return res.status(400).json({ error: "Cannot edit archived tournament!" });
        }

        // allow tournamenthosts to only edit banner
        let actioner = currentUser;
        if (!actioner.isCommittee && tournament.host._id.equals(currentUser._id)) {
            actioner = tournament.host;

            if (forumUrl || startDate || endDate || status || isActive || winners) {
                return res.status(403).json({ error: "Hosts can only edit banner!" });
            }
        }

        let shouldSendOsuMessage = true;
        const excludedStatusesOsu = ["supportRequestReceived", "screeningConcluded", "onHold"];

        if (forumUrl) tournament.forumUrl = forumUrl;
        if (enchantUrl) tournament.enchantUrl = enchantUrl;
        if (startDate) tournament.startDate = startDate;
        if (endDate) tournament.endDate = endDate;
        if (tags) tournament.tags = tags.map((tag: string) => tag.toLowerCase());
        if (status) {
            // Block "badgeApproved" status if host has an active infringement
            if (status === "badgeApproved" && tournament.host.activeInfringement) {
                return res.status(400).json({
                    error: `Cannot approve badges for host with an active ${tournament.host.activeInfringement.typeString}!`,
                });
            }

            if (excludedStatusesOsu.includes(status)) {
                shouldSendOsuMessage = false;
            }
            if (status === "reviewOngoing" && tournament.status === "onHold") {
                shouldSendOsuMessage = false;
            }

            tournament.status = status;

            if (status === "reviewOngoing") {
                tournament.startedReviewAt = new Date();
            }
        }
        if (isActive !== undefined) tournament.isActive = isActive;
        if (typeof bannerUrl === "string") tournament.bannerUrl = bannerUrl;
        if (winners) {
            const winnersWithActiveTournamentBan = winners.filter(
                (winner) =>
                    winner.activeInfringement && winner.activeInfringement.type === InfringementType.TOURNAMENT_BAN
            );
            if (winnersWithActiveTournamentBan.length > 0) {
                return res.status(400).json({
                    error: `Cannot add winners with active tournament bans! (${winnersWithActiveTournamentBan
                        .map((winner) => `${winner.username}`)
                        .join(", ")})`,
                });
            }
            tournament.winners = winners;
        }

        await tournament.save();

        res.json({ message: "Tournament updated successfully!" });

        // logging
        if (forumUrl) {
            await TournamentService.addTournamentLog(
                tournament,
                currentUser,
                `Updated forum URL: **${forumUrl}**`,
                "link"
            );
            await LogService.generate(currentUser.id, `Updated forum URL for **${tournament.name}**`, "tournament");
        }

        if (enchantUrl) {
            await TournamentService.addTournamentLog(
                tournament,
                currentUser,
                `Updated Enchant ticket URL: **${enchantUrl}**`,
                "link"
            );
            await LogService.generate(
                currentUser.id,
                `Updated Enchant ticket URL for **${tournament.name}**`,
                "tournament"
            );
        }

        if (startDate && endDate) {
            await TournamentService.addTournamentLog(
                tournament,
                currentUser,
                `Updated start and end date: **${moment(startDate).format("YYYY-MM-DD")}** — **${moment(endDate).format(
                    "YYYY-MM-DD"
                )}**`,
                "calendar"
            );
            await LogService.generate(
                currentUser.id,
                `Updated start and end date for **${tournament.name}**`,
                "tournament"
            );
        }

        if (tags) {
            await TournamentService.addTournamentLog(
                tournament,
                actioner,
                `Updated tags: ${tags.map((tag: string) => `\`${tag}\``).join(", ")}`,
                "tag"
            );
            await LogService.generate(actioner.id, `Updated tags for **${tournament.name}**`, "tournament");
        }

        if (bannerUrl) {
            await TournamentService.addTournamentLog(tournament, actioner, `Updated banner`, "image");
            await LogService.generate(actioner.id, `Updated banner for **${tournament.name}**`, "tournament");
        }

        if (winners) {
            // Need to re-fetch because tournament.winners is depopulated after update
            const winnerUsers = await User.find({ _id: { $in: winners } }).select("username osuId");

            await TournamentService.addTournamentLog(
                tournament,
                currentUser,
                `Updated winners: ${winnerUsers
                    .map((w: IUser) => `[**${w.username}**](${w.osuProfileUrl})`)
                    .join(", ")}`,
                "trophy"
            );
            await LogService.generate(currentUser.id, `Updated winners for **${tournament.name}**`, "tournament");
        }

        if (status) {
            // logging
            await TournamentService.addTournamentLog(
                tournament,
                currentUser,
                `Updated status to **${_.startCase(status)}**`,
                "flag"
            );
            await LogService.generate(currentUser.id, `Updated status for **${tournament.name}**`, "tournament");

            // osu! message
            let message = `The official support status of your tournament **${
                tournament.name
            }** has been updated to **${_.startCase(
                status
            )}**.\n\n[View your tournament in the Tournament Tracker by clicking here](${config.baseUrl}/tournaments/${
                tournament._id
            }).`;

            if (status === "screeningConcluded") {
                message += `\n\nPlease check your email for more information about potentially screened-out players.`;
            } else if (status === "changesRequested") {
                message += `\n\nPlease check your email for more information about the changes requested, or visit the [Tournament Tracker](${config.baseUrl}/tournaments/${tournament._id}) for a brief overview of the changes.`;
            } else if (status === "badgeApproved") {
                message += `\n\nCongratulations! Your tournament has been approved for badge support! You will receive an email with more information soon.`;
            } else if (status === "badgeRejected") {
                message += `\n\nUnfortunately, your tournament has been rejected for badge support. You will receive an email with more information soon.`;
            }

            if (shouldSendOsuMessage) {
                await OsuBotService.sendAnnouncement(
                    [tournament.host.osuId],
                    {
                        channel: {
                            name: `Tournament Status Update`,
                            description: `Update regarding: ${tournament.name}`,
                        },
                        content: message,
                    },
                    currentUser.osuId
                );
            }

            // Discord
            const excludedStatusesDiscord = ["supportRequestReceived", "screeningConcluded", "reviewOngoing"];

            if (!excludedStatusesDiscord.includes(status) || (status === "reviewOngoing" && oldStatus === "onHold")) {
                let embedColor = webhookColors.orange;

                // Change color based on status
                if (status === "supportRequestReceived") embedColor = webhookColors.lightPurple;
                if (status === "screeningConcluded") embedColor = webhookColors.blue;
                if (status === "changesRequested") embedColor = webhookColors.yellow;
                if (status === "onHold") embedColor = webhookColors.darkPink;
                if (status === "badgeApproved") embedColor = webhookColors.lightGreen;
                if (status === "badgeRejected") embedColor = webhookColors.lightRed;
                if (status === "noBadgeRequested") embedColor = webhookColors.gray;

                const embed = {
                    author: DiscordService.defaultWebhookAuthor(req.session),
                    color: embedColor,
                    description: `Updated status for ${tournament.type}: [**${tournament.name}**](${config.baseUrl}/tournaments/${tournament._id})`,
                    fields: [
                        {
                            name: "New Status",
                            value: `${_.startCase(status)}`,
                        },
                    ],
                };

                await DiscordService.sendWebhook({
                    embeds: [embed],
                    threadId: tournament.threadId,
                });
            }
        }

        if (isActive !== undefined) {
            // logging
            await TournamentService.addTournamentLog(
                tournament,
                currentUser,
                `${isActive ? "Unarchived" : "Archived"} tournament`,
                "archive"
            );
            await LogService.generate(currentUser.id, `Updated active status for **${tournament.name}**`, "tournament");

            // Discord
            const embed = {
                author: DiscordService.defaultWebhookAuthor(req.session),
                color: isActive ? webhookColors.gray : webhookColors.black,
                description: `${isActive ? "Unarchived" : "Archived"} ${tournament.type}: [**${tournament.name}**](${
                    config.baseUrl
                }/tournaments/${tournament._id})`,
            };

            await DiscordService.sendWebhook({
                embeds: [embed],
                threadId: tournament.threadId,
            });
        }
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
            (reviewer) => reviewer.toString() === oldReviewerId
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
            { new: true, runValidators: true }
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
            "user-pen"
        );

        await LogService.generate(
            currentUser.id,
            `Reassigned reviewer for **${tournament.name}** from [**${oldReviewer.username}**](${oldReviewer.osuProfileUrl}) to [**${newReviewer.username}**](${newReviewer.osuProfileUrl})`,
            "tournament"
        );

        // Discord
        const usersToPing = [
            oldReviewer.discordId || oldReviewer.username,
            newReviewer.discordId || newReviewer.username,
        ];
        const embed = {
            author: DiscordService.defaultWebhookAuthor(req.session),
            color: webhookColors.lightOrange,
            description: `Reassigned reviewer for ${tournament.type}: [**${tournament.name}**](${config.baseUrl}/tournaments/${tournament._id})`,
            fields: [
                {
                    name: "Old Reviewer",
                    value: `[**${oldReviewer.username}**](${oldReviewer.osuProfileUrl})`,
                    inline: true,
                },
                {
                    name: "New Reviewer",
                    value: `[**${newReviewer.username}**](${newReviewer.osuProfileUrl})`,
                    inline: true,
                },
            ],
        };

        await DiscordService.sendUserHighlightWebhook({
            users: usersToPing,
            embeds: [embed],
            message: "Tournament Review Reassignment",
            threadId: tournament.threadId,
        });
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
        let color = webhookColors.lightBlue;
        if (vote === "changesRequested") color = webhookColors.yellow;
        if (vote === "deny") color = webhookColors.lightRed;
        if (vote === "approve") color = webhookColors.lightGreen;

        let emoji = "❔";
        if (vote === "changesRequested") emoji = "🔄";
        if (vote === "deny") emoji = "❌";
        if (vote === "approve") emoji = "✅";

        // get count of false checklist items, iterate through the review.checklist and count the checked: false items
        const falseCount = review.checklist.filter((item) => !item.checked).length;

        const embed = {
            author: DiscordService.defaultWebhookAuthor(req.session),
            description: `${isNewReview ? "Submitted a" : "Updated their"} review for ${tournament.type}: [**${
                tournament.name
            }**](${config.baseUrl}/tournaments/${tournament._id})`,
            color,
            fields: [
                {
                    name: "Decision",
                    value: `${emoji} ${_.startCase(vote)}`,
                    inline: true,
                },
                {
                    name: "Checklist Issues",
                    value: `${falseCount > 0 ? "⚠️" : "🎉"} ${falseCount}`,
                    inline: true,
                },
                {
                    name: "Comment",
                    value: comment.trim().length > 0 ? utils.shorten(comment, 512) : "*No comment provided...*",
                },
            ],
        };

        await DiscordService.sendWebhook({
            embeds: [embed],
            notification: "silent",
            threadId: tournament.threadId,
        });
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
                currentUser.id
            );

            await note.save();
            tournament.notes.push(note);

            // logging and Discord notification for failed badges
            await TournamentService.addTournamentLog(
                tournament,
                currentUser,
                `Created note for failed badge uploads`,
                "sticky-note"
            );
            await LogService.generate(
                currentUser.id,
                `Created note for failed badge uploads for **${tournament.name}**`,
                "tournament"
            );

            // Discord notification for failed badges note
            const fields: IDiscordField[] = [
                {
                    name: "Note",
                    value: utils.shorten(noteContent, 512),
                },
            ];

            if (note.attachments?.length) {
                fields.push(utils.getAttachmentsField(note.attachments)!);
            }

            const embed = {
                author: DiscordService.defaultWebhookAuthor(req.session),
                description: `Added a note for failed badge uploads for ${tournament.type}: [**${tournament.name}**](${config.baseUrl}/tournaments/${tournament._id})`,
                color: webhookColors.yellow,
                fields,
            };

            await DiscordService.sendWebhook({
                embeds: [embed],
                threadId: tournament.threadId,
            });
        }

        // Upload only valid badges
        if (validFiles.length > 0) {
            const badges = await UploadService.handleFileUploads(
                validFiles,
                FILE_UPLOAD_CATEGORY,
                tournament.id,
                currentUser.id
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
            res.setHeader("Content-Disposition", `attachment; filename=${sanitizedTournamentName} Badges.zip`);

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
                "link"
            );
            await LogService.generate(
                currentUser.id,
                `Updated Discord thread ID for **${tournament.name}**`,
                "tournament"
            );

            // discord
            const embed = {
                author: DiscordService.defaultWebhookAuthor(req.session),
                color: webhookColors.white,
                description: `Updated webhook location for ${tournament.type}: [**${tournament.name}**](${config.baseUrl}/tournaments/${tournament._id})`,
                fields: [
                    {
                        name: "New Location",
                        value: `<#${threadId && threadId.length ? threadId : config.discord.webhooks.main.channelId}>`,
                    },
                ],
            };

            await DiscordService.sendWebhook({
                embeds: [embed],
                threadId: tournament.threadId,
            });
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
                currentUser.id
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
        const fields: IDiscordField[] = [
            {
                name: "Note",
                value: utils.shorten(content, 512),
            },
        ];

        if (note.attachments?.length) {
            fields.push(utils.getAttachmentsField(note.attachments)!);
        }
        const embed = {
            author: DiscordService.defaultWebhookAuthor(req.session),
            description: `Added a note for ${tournament.type}: [**${tournament.name}**](${config.baseUrl}/tournaments/${tournament._id})`,
            color: webhookColors.blue,
            fields,
        };

        await DiscordService.sendWebhook({
            embeds: [embed],
            threadId: tournament.threadId,
        });
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
