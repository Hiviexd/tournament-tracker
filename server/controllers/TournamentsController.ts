import { Request, Response } from "express";
import Tournament from "../models/tournamentModel";
import UserService from "../services/UserService";
import { TournamentQueryParams, TournamentType, TournamentStatus, GameMode } from "../../interfaces/Tournament";
import { UserGroup } from "../../interfaces/User";
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
// import OsuBotService from "../services/OsuBotService";
import helpers from "../helpers";
import { IDiscordField } from "@interfaces/Discord";

const defaultPopulate = [
    {
        path: "host",
        select: "username osuId groups",
    },
    {
        path: "assignedReviewers",
        select: "username osuId groups coverUrl isActiveReviewer",
    },
    {
        path: "reviews",
        select: "comment author vote checklist",
        populate: {
            path: "author",
            select: "username osuId groups",
        },
    },
    {
        path: "banner",
        select: "url",
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
            select: "username osuId groups",
        },
    },
    {
        path: "notes",
        select: "content author isNote attachments createdAt",
        populate: [
            {
                path: "author",
                select: "username osuId groups",
            },
            {
                path: "attachments",
                select: "originalName url size type",
            },
        ],
    },
];

const DEFAULT_LIMIT = 20;

const FILE_UPLOAD_CATEGORY = "tournaments";

const selectFields = (isCommittee: boolean) => (isCommittee ? "" : "-reviews -assignedReviewers -notes -logs");

class TournamentsController {
    /** GET tournament listing */
    public async index(req: Request, res: Response) {
        const { name, mode, host, type, status, state, showNeedsAttention, page = 1 } = req.query;
        const query: TournamentQueryParams = {};
        const user = res.locals!.user;

        if (name) query.name = new RegExp(name as string, "i");
        if (mode) query.modes = { $in: [mode as GameMode] };
        if (host) {
            const hostUser = await User.findByUsernameOrOsuId(host as string);
            if (hostUser) query.host = hostUser._id;
        }
        if (type) query.type = type as TournamentType;
        if (status) query.status = status as TournamentStatus;
        if (state) query.isActive = state === "active";

        if (showNeedsAttention === "true" && user && user.isCommittee) {
            query.isActive = true;
            // match tournaments where:
            // 1. status is reviewOngoing or changesRequested
            // 2. user is in assignedReviewers array
            query.$and = [
                {
                    $or: [{ status: "reviewOngoing" }, { status: "changesRequested" }],
                },
                { assignedReviewers: user._id },
            ];
        }

        const skip = (Number(page) - 1) * DEFAULT_LIMIT;
        const isCommittee = res.locals!.user!.isCommittee;

        const populationFilter = [
            { path: "reviews", select: false },
            { path: "assignedReviewers", select: false },
            { path: "notes", select: false },
            { path: "logs", select: false },
        ];

        const [tournaments, total] = await Promise.all([
            Tournament.aggregate([
                { $match: query },
                {
                    $addFields: {
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
                                    { case: { $eq: ["$status", "reviewOngoing"] }, then: 3 },
                                    { case: { $eq: ["$status", "screeningConcluded"] }, then: 4 },
                                    { case: { $eq: ["$status", "screeningOngoing"] }, then: 5 },
                                    { case: { $eq: ["$status", "supportRequestReceived"] }, then: 6 },
                                ],
                                default: 7,
                            },
                        },
                    },
                },
                {
                    $sort: {
                        isActive: -1,
                        statusOrder: 1,
                        createdAt: -1,
                    },
                },
                { $skip: skip },
                { $limit: DEFAULT_LIMIT },
                { $project: { statusOrder: 0 } },
            ])
                .exec()
                .then((tournaments) =>
                    Tournament.populate(tournaments, [...defaultPopulate, ...(isCommittee ? [] : populationFilter)])
                )
                .then((tournaments) => tournaments.map((t) => Tournament.hydrate(t).toJSON())),
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
        const isCommittee = res.locals!.user!.isCommittee;

        const tournament = await Tournament.findById(tournamentId)
            .select(selectFields(isCommittee))
            .populate(defaultPopulate);

        res.json(tournament);
    }

    /** POST create a tournament */
    public async create(req: Request, res: Response) {
        const { name, hostId, modes, type, forumUrl, startDate, endDate } = req.body;
        const files = req.files as Express.Multer.File[];
        const currentUser = res.locals!.user!;

        const host = await User.findById(hostId).orFail();

        const status: TournamentStatus = "supportRequestReceived";

        const tournament = new Tournament({
            name,
            host,
            modes,
            type,
            status,
            forumUrl,
            startDate,
            endDate,
        });

        if (files?.length) {
            const banner = await UploadService.handleFileUploads(
                files,
                FILE_UPLOAD_CATEGORY,
                tournament._id,
                currentUser._id
            );

            tournament.banner = banner[0];
        }

        await tournament.save();

        res.json({ message: "Tournament created successfully!", tournament });

        // logging
        await LogService.generate(currentUser._id, `Created tournament: **${tournament.name}**`, "tournament");
        await TournamentService.addLog(tournament, currentUser, `Created tournament`, "trophy");

        // Discord
        await DiscordService.sendWebhook([
            {
                author: DiscordService.defaultWebhookAuthor(req.session),
                color: webhookColors.darkGreen,
                description: `Created new ${tournament.type}: [**${tournament.name}**](${config.baseUrl}/tournaments/${tournament._id})`,
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
                        value: tournament.modes.map((mode) => helpers.formatGameMode(mode)).join(", "),
                        inline: true,
                    },
                    {
                        name: "Forum URL",
                        value: tournament.forumUrl,
                    },
                ],
                image: {
                    url: tournament.banner?.url || "",
                },
            },
        ]);
    }

    /** POST assign reviewers */
    public async assignReviewers(req: Request, res: Response) {
        const tournamentId = req.params.tournamentId;
        const currentUser = res.locals!.user!;

        const tournament = await Tournament.findById(tournamentId).orFail();

        const reviewerTypeMap: { [key in TournamentType]: UserGroup } = {
            tournament: "tc",
            contest: "cc",
        };

        const assignedReviewersType = reviewerTypeMap[tournament.type];

        const reviewers = await UserService.assignReviewers(assignedReviewersType);

        tournament.assignedReviewers = reviewers;

        await tournament.save();

        res.json({ message: "Reviewers assigned successfully!" });

        // logging
        await TournamentService.addLog(
            tournament,
            currentUser,
            `Assigned reviewers: ${reviewers.map((r) => `[**${r.username}**](${r.osuProfileUrl})`).join(", ")}`,
            "users"
        );

        await LogService.generate(currentUser._id, `Assigned reviewers to **${tournament.name}**`, "tournament");

        // Discord
        //const usersToPing = reviewers.map((r) => r.discordId || r.username);
        const usersToPing = [];
        await DiscordService.sendUserHighlightWebhook(
            usersToPing,
            [
                {
                    author: DiscordService.defaultWebhookAuthor(req.session),
                    color: webhookColors.orange,
                    description: `Assigned reviewers to ${tournament.type}: [**${tournament.name}**](${config.baseUrl}/tournaments/${tournament._id})`,
                    fields: [
                        {
                            name: "Reviewers",
                            value: reviewers.map((r) => `[**${r.username}**](${r.osuProfileUrl})`).join(", "),
                        },
                    ],
                },
            ],
            "",
            tournament.threadId
        );
    }

    /** POST edit tournament */
    public async edit(req: Request, res: Response) {
        const tournamentId = req.params.tournamentId;
        const currentUser = res.locals!.user!;

        const { forumUrl, startDate, endDate, status, isActive } = req.body;

        const tournament = await Tournament.findById(tournamentId).populate(defaultPopulate).orFail();

        if (!tournament.isActive && isActive === undefined) {
            return res.json({ error: "Cannot edit archived tournament!" });
        }

        if (forumUrl) tournament.forumUrl = forumUrl;
        if (startDate) tournament.startDate = startDate;
        if (endDate) tournament.endDate = endDate;
        if (status) {
            tournament.status = status;
            if (status === "reviewOngoing") {
                tournament.startedReviewAt = new Date();
            }
        }
        if (isActive !== undefined) tournament.isActive = isActive;

        await tournament.save();

        res.json({ message: "Tournament updated successfully!" });

        // logging
        if (forumUrl) {
            await TournamentService.addLog(tournament, currentUser, `Updated forum URL: **${forumUrl}**`, "link");
            await LogService.generate(currentUser._id, `Updated forum URL for **${tournament.name}**`, "tournament");
        }

        if (startDate && endDate) {
            await TournamentService.addLog(
                tournament,
                currentUser,
                `Updated start and end date: **${moment(startDate).format("YYYY-MM-DD")}** — **${moment(endDate).format(
                    "YYYY-MM-DD"
                )}**`,
                "calendar"
            );
            await LogService.generate(
                currentUser._id,
                `Updated start and end date for **${tournament.name}**`,
                "tournament"
            );
        }

        if (status) {
            // logging
            await TournamentService.addLog(
                tournament,
                currentUser,
                `Updated status to **${_.startCase(status)}**`,
                "flag"
            );
            await LogService.generate(currentUser._id, `Updated status for **${tournament.name}**`, "tournament");

            // osu! message
            const recipientId = process.env.NODE_ENV === "production" ? tournament.host.osuId : currentUser.osuId;

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
                message += `\n\nPlease check your email for more information about the changes requested.`;
            } else if (status === "badgeApproved") {
                message += `\n\nCongratulations! Your tournament has been approved for badge support! You will receive an email with more information soon.`;
            } else if (status === "badgeRejected") {
                message += `\n\nUnfortunately, your tournament has been rejected for badge support. You will receive an email with more information soon.`;
            }

            console.log(recipientId, message);

            /*await OsuBotService.sendAnnouncement([recipientId], {
                channel: {
                    name: `Tournament Status Update`,
                    description: `Update regarding: ${tournament.name}`,
                },
                content: message,
            });*/

            // Discord
            // Exclude review ongoing status to avoid dupe embeds with the assign users one
            if (status !== "reviewOngoing") {
                let embedColor = webhookColors.darkOrange;

                // Change color based on status
                if (status === "supportRequestReceived") embedColor = webhookColors.lightPurple;
                if (status === "screeningOngoing") embedColor = webhookColors.darkBlue;
                if (status === "screeningConcluded") embedColor = webhookColors.blue;
                if (status === "changesRequested") embedColor = webhookColors.yellow;
                if (status === "badgeApproved") embedColor = webhookColors.lightGreen;
                if (status === "badgeRejected") embedColor = webhookColors.lightRed;
                if (status === "noBadgeRequested") embedColor = webhookColors.gray;

                await DiscordService.sendWebhook(
                    [
                        {
                            author: DiscordService.defaultWebhookAuthor(req.session),
                            color: embedColor,
                            description: `Updated status for ${tournament.type}: [**${tournament.name}**](${config.baseUrl}/tournaments/${tournament._id})`,
                            fields: [
                                {
                                    name: "New Status",
                                    value: `**${_.startCase(status)}**`,
                                },
                            ],
                        },
                    ],
                    "",
                    undefined,
                    tournament.threadId
                );
            }
        }

        if (isActive !== undefined) {
            // logging
            await TournamentService.addLog(
                tournament,
                currentUser,
                `${isActive ? "Unarchived" : "Archived"} tournament`,
                "archive"
            );
            await LogService.generate(
                currentUser._id,
                `Updated active status for **${tournament.name}**`,
                "tournament"
            );

            // Discord
            await DiscordService.sendWebhook(
                [
                    {
                        author: DiscordService.defaultWebhookAuthor(req.session),
                        color: isActive ? webhookColors.gray : webhookColors.black,
                        description: `${isActive ? "Unarchived" : "Archived"} ${tournament.type}: [**${
                            tournament.name
                        }**](${config.baseUrl}/tournaments/${tournament._id})`,
                    },
                ],
                "",
                undefined,
                tournament.threadId
            );
        }
    }

    /** POST reassign reviewer */
    public async reassignReviewer(req: Request, res: Response) {
        const tournamentId = req.params.tournamentId;
        const currentUser = res.locals!.user!;

        const { oldReviewerId, newReviewerId } = req.body;

        if (!oldReviewerId || !newReviewerId) {
            return res.json({ error: "Both old and new reviewer IDs are required" });
        }

        // Find tournament without populating first to check and get a proper reference
        const tournament = await Tournament.findById(tournamentId).orFail();

        if (!tournament.assignedReviewers || tournament.assignedReviewers.length === 0) {
            return res.json({ error: "Tournament has no assigned reviewers" });
        }

        // Check if old reviewer is actually assigned
        const oldReviewerIndex = tournament.assignedReviewers.findIndex(
            (reviewer) => reviewer.toString() === oldReviewerId
        );

        if (oldReviewerIndex === -1) {
            return res.json({ error: "Old reviewer is not assigned to this tournament" });
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
            return res.json({
                error: `New reviewer must be a member of ${requiredGroup.toUpperCase()}`,
            });
        }

        // Check if new reviewer is already assigned
        if (tournament.assignedReviewers.some((reviewer) => reviewer.toString() === newReviewerId)) {
            return res.json({ error: "New reviewer is already assigned to this tournament" });
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
        await TournamentService.addLog(
            tournament,
            currentUser,
            `Reassigned reviewer from [**${oldReviewer.username}**](${oldReviewer.osuProfileUrl}) to [**${newReviewer.username}**](${newReviewer.osuProfileUrl})`,
            "user-pen"
        );

        await LogService.generate(currentUser._id, `Reassigned reviewer for **${tournament.name}**`, "tournament");

        // Discord
        const usersToPing = [
            // oldReviewer.discordId || oldReviewer.username,
            // newReviewer.discordId || newReviewer.username,
        ];
        await DiscordService.sendUserHighlightWebhook(
            usersToPing,
            [
                {
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
                },
            ],
            "",
            tournament.threadId
        );
    }

    /** POST submit review */
    public async submitReview(req: Request, res: Response) {
        const tournamentId = req.params.tournamentId;
        const currentUser = res.locals!.user!;

        const { checklist, comment, vote } = req.body;

        const tournament = await Tournament.findById(tournamentId).populate(defaultPopulate).orFail();

        if (!tournament.isActive) {
            return res.json({ error: "Tournament is not active" });
        }

        if (!checklist || !checklist.length || !vote) {
            return res.json({ error: "Missing required fields" });
        }

        if (vote !== "approve" && vote !== "changesRequested" && vote !== "deny") {
            return res.json({ error: "Invalid vote" });
        }

        if (checklist.some((item) => item.checked === undefined)) {
            return res.json({ error: "Invalid checklist" });
        }

        let review = tournament.reviews.find((review) => review.author.equals(res.locals!.user!._id));
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
            await TournamentService.addLog(tournament, currentUser, `Submitted review`, "check-to-slot");
            await LogService.generate(currentUser._id, `Submitted review for **${tournament.name}**`, "tournament");
        }

        // Discord
        await DiscordService.sendWebhook(
            [
                {
                    author: DiscordService.defaultWebhookAuthor(req.session),
                    description: `${isNewReview ? "Submitted" : "Updated"} a review for ${tournament.type}: [**${
                        tournament.name
                    }**](${config.baseUrl}/tournaments/${tournament._id})`,
                    color: isNewReview ? webhookColors.lightGreen : webhookColors.lightBlue,
                    fields: [
                        {
                            name: "Decision",
                            value: `**${_.startCase(vote)}**`,
                        },
                    ],
                },
            ],
            undefined,
            "silent",
            tournament.threadId
        );
    }

    /** POST upload badges */
    public async uploadBadges(req: Request, res: Response) {
        const tournamentId = req.params.tournamentId;
        const files = req.files as Express.Multer.File[];
        const currentUser = res.locals!.user!;

        const tournament = await Tournament.findById(tournamentId).orFail();

        if (!files?.length) {
            return res.json({ error: "No files uploaded" });
        }

        // Check dimensions of each file before uploading
        for (const file of files) {
            try {
                const metadata = await sharp(file.buffer).metadata();

                if (metadata.width !== 172 || metadata.height !== 80) {
                    return res.json({
                        error: `Invalid badge dimensions in file ${file.originalname}. Expected 172x80, got ${metadata.width}x${metadata.height}`,
                    });
                }
            } catch (error) {
                return res.json({
                    error: "Failed to process image. Please ensure it's a valid PNG or JPG file.",
                });
            }
        }

        const badges = await UploadService.handleFileUploads(
            files,
            FILE_UPLOAD_CATEGORY,
            tournament._id,
            currentUser._id
        );

        console.log(badges);
        tournament.badges = badges;

        await tournament.save();

        res.json({ message: "Badges uploaded successfully!" });

        // logging
        await TournamentService.addLog(tournament, currentUser, `Uploaded badges`, "image");
        await LogService.generate(currentUser._id, `Uploaded badges for **${tournament.name}**`, "tournament");
    }

    /** GET download badges */
    public async downloadBadges(req: Request, res: Response) {
        const tournamentId = req.params.tournamentId;
        const tournament = await Tournament.findById(tournamentId).populate(defaultPopulate).orFail();

        const badges = tournament.badges;

        if (!badges?.length) {
            return res.json({ error: "No badges found" });
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
            res.setHeader("Content-Disposition", `attachment; filename=${tournament.name}-badges.zip`);

            // Pipe archive data to the response
            archive.pipe(res);

            let badgeCount = 1;

            // Process each badge
            for (const badge of badges) {
                try {
                    // Download the badge image
                    const response = await axios.get(badge.url, { responseType: "arraybuffer" });
                    const buffer = Buffer.from(response.data);

                    // Get file extension from URL
                    const ext = badge.url.split(".").pop();
                    let baseFilename = tournament.name.replace(/[^a-z0-9]/gi, "-").toLowerCase();

                    if (badgeCount > 1) {
                        baseFilename = `${baseFilename}-${badgeCount}`;
                    }

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

                    badgeCount++;
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
                res.json({ error: "Failed to create badge archive" });
            }
        }
    }

    /** POST update thread ID */
    public async updateThreadId(req: Request, res: Response) {
        const tournamentId = req.params.tournamentId;
        const currentUser = res.locals!.user!;

        let threadId = req.body.threadId;

        const tournament = await Tournament.findById(tournamentId).populate(defaultPopulate).orFail();

        if (threadId.includes("https://discord.com/channels/")) {
            threadId = threadId.split("/").pop();
        }

        if (threadId !== tournament.threadId) {
            tournament.threadId = threadId;
            await tournament.save();

            res.json({ message: "Thread ID updated successfully!" });

            // logging
            await TournamentService.addLog(
                tournament,
                currentUser,
                `Updated Discord thread ID: **${threadId && threadId.length ? threadId : "#t-committee"}**`,
                "link"
            );
            await LogService.generate(
                currentUser._id,
                `Updated Discord thread ID for **${tournament.name}**`,
                "tournament"
            );

            // discord
            await DiscordService.sendWebhook(
                [
                    {
                        author: DiscordService.defaultWebhookAuthor(req.session),
                        color: webhookColors.white,
                        description: `Updated webhook location for ${tournament.type}: [**${tournament.name}**](${config.baseUrl}/tournaments/${tournament._id})`,
                        fields: [
                            {
                                name: "New Location",
                                value: `<#${
                                    threadId && threadId.length ? threadId : config.discord.webhooks.main.channelId
                                }>`,
                            },
                        ],
                    },
                ],
                "",
                undefined,
                tournament.threadId
            );
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
                tournament._id,
                currentUser._id
            );
        }

        await note.save();

        tournament.notes.push(note);
        await tournament.save();

        res.json({ message: "Note created successfully!" });

        // logging
        await TournamentService.addLog(tournament, currentUser, `Created note`, "sticky-note");
        await LogService.generate(currentUser._id, `Created note for **${tournament.name}**`, "tournament");

        // Discord
        const fields: IDiscordField[] = [
            {
                name: "Note",
                value: helpers.shorten(content, 512),
            },
        ];

        if (note.attachments?.length) {
            fields.push(helpers.getAttachmentsField(note.attachments)!);
        }
        await DiscordService.sendWebhook(
            [
                {
                    author: DiscordService.defaultWebhookAuthor(req.session),
                    description: `Added a note for ${tournament.type}: [**${tournament.name}**](${config.baseUrl}/tournaments/${tournament._id})`,
                    color: webhookColors.blue,
                    fields,
                },
            ],
            "",
            undefined,
            tournament.threadId
        );
    }
}

export default new TournamentsController();
