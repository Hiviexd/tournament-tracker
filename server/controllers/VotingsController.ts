import Voting from "../models/votingModel";
import Vote from "../models/voteModel";
import { VotingQueryParams, VotingListQuery, IVoting } from "../../interfaces/Voting";
import User from "../models/userModel";
import { IUser } from "../../interfaces/User";
import { IDiscordField } from "@interfaces/Discord";
import DiscordService from "../services/DiscordService";
import webhookColors from "../constants/webhookColors";
import config from "../../config.json";
import LogService from "../services/LogService";
import helpers from "../helpers";
import { Request, Response } from "express";
import UploadService from "../services/UploadService";
import VotingService from "../services/VotingService";

const DEFAULT_POPULATE = [
    { path: "author", select: "username osuId groups" },
    {
        path: "votes",
        populate: {
            path: "author",
            select: "username osuId groups",
        },
    },
    { path: "targetUser", select: "username osuId groups coverUrl" },
    { path: "targetTournament", select: "name" },
    { path: "attachments", select: "originalName url size type" },
];

const DEFAULT_LIMIT = 10;

const STRICT_PARTICIPATION_PERCENTAGE = 0.75;

const FILE_UPLOAD_CATEGORY = "votings";

class VotingsController {
    /** GET voting listing */
    public async index(req: Request, res: Response) {
        const reqQuery = req.query as VotingListQuery;
        const dbQuery: VotingQueryParams = {};
        const user = res.locals!.user!;

        if (reqQuery.title) dbQuery.title = new RegExp(reqQuery.title, "i");
        if (reqQuery.category) dbQuery.category = reqQuery.category;
        if (reqQuery.assignedGroup) dbQuery.assignedGroups = { $in: [reqQuery.assignedGroup] };

        // Only show concluded AND public votes to non-committee members
        if (!user.isCommittee) {
            dbQuery.isActive = false;
            dbQuery.isPublic = true;
        } else if (reqQuery.status) {
            dbQuery.isActive = reqQuery.status === "active";
        }

        // Handle needs attention filter for committee members
        if (reqQuery.showNeedsAttention === "true" && user.isCommittee) {
            dbQuery.isActive = true;
            // Only show votes where:
            // 1. User hasn't voted yet
            // 2. User is in one of the assigned groups
            dbQuery.$and = [
                {
                    votes: {
                        $not: {
                            $elemMatch: {
                                author: req.session.mongoId,
                            },
                        },
                    },
                },
                {
                    $or: [
                        {
                            $and: [{ assignedGroups: "tc" }, { $expr: { $eq: [user.isTournamentCommittee, true] } }],
                        },
                        {
                            $and: [{ assignedGroups: "cc" }, { $expr: { $eq: [user.isContestCommittee, true] } }],
                        },
                    ],
                },
            ];
        }

        const page = Number(reqQuery.page || 1);
        const skip = (page - 1) * DEFAULT_LIMIT;

        // Get total count before pagination
        const total = await Voting.countDocuments(dbQuery);

        let votings = await Voting.find(dbQuery)
            .skip(skip)
            .limit(DEFAULT_LIMIT)
            .sort({ createdAt: -1 })
            .populate(DEFAULT_POPULATE);

        // Censor votings for non-committee members
        if (!user.isCommittee) {
            votings = votings.map((voting) =>
                VotingService.censorVotingForNonCommittee(voting)
            ) as unknown as IVoting[];
        }

        res.json({
            votings,
            total,
            page,
            pages: Math.ceil(total / DEFAULT_LIMIT),
        });
    }

    /** GET a voting */
    public async getVoting(req: Request, res: Response) {
        const votingId = req.params.votingId;
        const user = res.locals!.user!;

        const voting = await Voting.findById(votingId).populate(DEFAULT_POPULATE).orFail();

        // Non-committee members can only view concluded public votes
        if (!user.isCommittee && (voting.isActive || !voting.isPublic)) {
            return res.json({ error: "You can only view concluded public votes" });
        }

        // Censor voting for non-committee members
        if (!user.isCommittee) {
            return res.json(VotingService.censorVotingForNonCommittee(voting));
        }

        res.json(voting);
    }

    /** POST create a voting */
    public async createVoting(req: Request, res: Response) {
        const {
            category,
            assignedGroups,
            title,
            description,
            duration,
            options,
            targetUserId,
            targetTournamentName,
            targetTournamentLink,
            type,
        } = req.body;
        const files = req.files as Express.Multer.File[];

        const author = res.locals!.user!;
        let targetUser: IUser;

        const assignedUsersCount = await User.countDocuments({ groups: { $in: assignedGroups } });
        const requiredVotes = Math.ceil(STRICT_PARTICIPATION_PERCENTAGE * assignedUsersCount);

        const voting = new Voting({
            author,
            category,
            assignedGroups,
            title,
            description,
            duration,
            type,
            options,
            requiredVotes,
        });

        if (category === "user") {
            if (!targetUserId) {
                return res.json({ error: "Missing target user ID" });
            }

            targetUser = await User.findById(targetUserId).orFail();
            voting.targetUser = targetUser;
        }

        if (category === "tournament") {
            if (!targetTournamentName || !targetTournamentLink) {
                return res.json({ error: "Missing target tournament details" });
            }

            const sanitizedTournamentName = targetTournamentName.trim();
            const sanitizedTournamentLink = targetTournamentLink.trim();

            if (sanitizedTournamentName.length < 5 || sanitizedTournamentName.length > 120)
                return res.json({ error: "Tournament name must be between 5 and 120 characters" });

            if (!helpers.isOsuForumLink(sanitizedTournamentLink))
                return res.json({ error: "Invalid tournament forum link" });

            voting.targetTournamentName = sanitizedTournamentName;
            voting.targetTournamentLink = sanitizedTournamentLink;
        }

        // Handle file uploads
        if (files?.length) {
            voting.attachments = await UploadService.handleFileUploads(
                files,
                FILE_UPLOAD_CATEGORY,
                voting._id,
                author._id
            );
        }

        await voting.save();

        res.json({
            message: "Vote created successfully!",
            voting,
        });

        // Logger
        await LogService.generate(
            req.session.mongoId!,
            `Created a new **${voting.category}** vote: [**${voting.title}**](${config.baseUrl}/votes/${voting._id})`,
            "voting"
        );

        // Discord
        const roles: string[] = [];
        const fields: IDiscordField[] = [];

        if (voting.assignedGroups.includes("tc")) roles.push("tournament");
        if (voting.assignedGroups.includes("cc")) roles.push("contest");

        fields.push({
            name: "Deadline",
            value: `${helpers.discordTimestamp(voting.deadline)} (${helpers.discordTimestamp(
                voting.deadline,
                "dateTime"
            )})`,
        });

        if (voting.targetUser) {
            fields.push({
                name: "Target User",
                value: `[**${voting.targetUser.username}**](https://osu.ppy.sh/users/${voting.targetUser.osuId})`,
            });
        }

        if (voting.targetTournamentName && voting.targetTournamentLink) {
            fields.push({
                name: "Target Tournament",
                value: `[**${voting.targetTournamentName}**](${voting.targetTournamentLink})`,
            });
        }

        fields.push({
            name: "Description",
            value: helpers.shorten(voting.description, 1024),
        });

        if (voting.attachments?.length) {
            fields.push(helpers.getAttachmentsField(voting.attachments)!);
        }

        await DiscordService.sendRoleHighlightWebhook(roles, [
            {
                author: DiscordService.defaultWebhookAuthor(req.session),
                description: `Created a new **${voting.category}** vote: [**${voting.title}**](${config.baseUrl}/votes/${voting._id})`,
                color: webhookColors.lightYellow,
                fields,
            },
        ]);
    }

    /** POST submit vote */
    public async submitVote(req: Request, res: Response) {
        const votingId = req.params.votingId;
        const { data, comment } = req.body;

        const author = res.locals!.user!;
        const voting = await Voting.findById(votingId).populate("votes").orFail();

        if (!voting.isActive) {
            return res.json({ message: "Vote is not active" });
        }

        if (!comment || comment.trim().length === 0) {
            return res.json({ error: "Comment is required" });
        }

        // Validate vote based on voting type
        if (data.type !== voting.type) {
            return res.json({ error: "Vote type does not match voting type" });
        }

        // Validate vote data based on type
        switch (data.type) {
            case "classic":
                if (typeof data.option !== "number" || data.option >= voting.options.length) {
                    return res.json({ error: "Invalid option index" });
                }
                break;
            case "binary":
                if (typeof data.score !== "number" || data.score < -5 || data.score > 5) {
                    return res.json({ error: "Invalid score (must be between -5 and 5)" });
                }
                break;
            case "variable":
                if (
                    !Array.isArray(data.scores) ||
                    !data.scores.every(
                        (s) =>
                            typeof s.optionIndex === "number" &&
                            s.optionIndex < voting.options.length &&
                            typeof s.score === "number" &&
                            s.score >= -5 &&
                            s.score <= 5
                    )
                ) {
                    return res.json({ error: "Invalid scores" });
                }
                break;
        }

        let vote = voting.votes.find((vote) => vote.author.equals(author._id));
        let isNewVote = false;

        if (!vote) {
            vote = new Vote({
                author,
                comment,
                data,
            });
            isNewVote = true;
        } else {
            vote.comment = comment;
            vote.data = data;
        }

        await vote.save();

        if (isNewVote) {
            voting.votes.push(vote);
            await voting.save();
        }

        res.json({
            message: "Vote submitted successfully!",
            voting,
        });

        if (isNewVote) {
            // Logger
            await LogService.generate(
                req.session.mongoId!,
                `Submitted a vote for [**${voting.title}**](${config.baseUrl}/votings/${voting._id})`,
                "voting"
            );

            // Discord
            await DiscordService.sendWebhook([
                {
                    author: DiscordService.defaultWebhookAuthor(req.session),
                    description: `Submitted a vote for [**${voting.title}**](${config.baseUrl}/votes/${voting._id})`,
                    color: webhookColors.lightGreen,
                },
            ]);
        }
    }

    /** POST toggle voting status */
    public async toggleVotingStatus(req: Request, res: Response) {
        const votingId = req.params.votingId;
        const voting = await Voting.findById(votingId).populate("votes").orFail();

        voting.isActive = !voting.isActive;
        await voting.save();

        res.json({
            message: `Vote status is now ${voting.isActive ? "active" : "concluded"}`,
        });

        // Logger
        await LogService.generate(
            req.session.mongoId!,
            `Toggled vote status for [**${voting.title}**](${config.baseUrl}/votes/${voting._id}) to ${
                voting.isActive ? "active" : "inactive"
            }`,
            "voting"
        );

        // Only send results if concluding the vote
        if (!voting.isActive) {
            const fields = VotingService.generateVotingResults(voting);

            await DiscordService.sendWebhook(
                [
                    {
                        author: DiscordService.defaultWebhookAuthor(req.session),
                        color: webhookColors.darkYellow,
                        description: `Concluded vote: [**${voting.title}**](${config.baseUrl}/votes/${voting._id})`,
                        fields,
                    },
                ],
                undefined,
                undefined,
                "main"
            );
        } else {
            // Voting resumed
            await DiscordService.sendWebhook([
                {
                    author: DiscordService.defaultWebhookAuthor(req.session),
                    description: `Resumed vote for [**${voting.title}**](${config.baseUrl}/votes/${voting._id})`,
                    color: webhookColors.yellow,
                },
            ]);
        }
    }

    /** POST update voting */
    public async updateVoting(req: Request, res: Response) {
        const votingId = req.params.votingId;
        const { title, description, duration, options } = req.body;

        const voting = await Voting.findById(votingId).orFail();

        if (!voting.isActive) {
            return res.json({ error: "Cannot edit inactive votes!" });
        }

        voting.title = title;
        voting.description = description;
        voting.duration = duration;

        // only update options when there is no votes
        if (!voting.votes.length) voting.options = options;

        await voting.save();

        res.json({
            message: "Vote updated successfully!",
            voting,
        });

        // Logger
        await LogService.generate(
            req.session.mongoId!,
            `Updated the vote: [**${voting.title}**](${config.baseUrl}/votes/${voting._id})`,
            "voting"
        );
    }

    /** POST delete a voting */
    public async deleteVoting(req: Request, res: Response) {
        const votingId = req.params.votingId;

        const voting = await Voting.findById(votingId).orFail();

        if (!voting.isActive) {
            return res.json({ error: "Cannot delete concluded votes!" });
        }

        if (voting.votes.length) {
            return res.json({ error: "Cannot delete voting with votes!" });
        }

        await voting.remove();

        res.json({
            message: "Vote deleted successfully!",
        });

        // Logger
        await LogService.generate(
            req.session.mongoId!,
            `Deleted the vote [**${voting.title}**](${config.baseUrl}/votes/${voting._id})`,
            "voting"
        );

        // Discord
        await DiscordService.sendWebhook([
            {
                author: DiscordService.defaultWebhookAuthor(req.session),
                description: `Deleted a vote: [**${voting.title}**](${config.baseUrl}/votes/${voting._id})`,
                color: webhookColors.darkRed,
            },
        ]);
    }

    /** POST toggle voting public */
    public async toggleVotingPublic(req: Request, res: Response) {
        const votingId = req.params.votingId;
        const voting = await Voting.findById(votingId).orFail();

        if (voting.isActive) {
            return res.json({ error: "Cannot change publicity of active votes" });
        }

        voting.isPublic = !voting.isPublic;
        await voting.save();

        res.json({
            message: `Vote is now ${voting.isPublic ? "public" : "private"}`,
        });

        // Logger
        await LogService.generate(
            req.session.mongoId!,
            `Made vote [**${voting.title}**](${config.baseUrl}/votes/${voting._id}) ${
                voting.isPublic ? "public" : "private"
            }`,
            "voting"
        );

        // Discord
        await DiscordService.sendWebhook([
            {
                author: DiscordService.defaultWebhookAuthor(req.session),
                description: `Made vote [**${voting.title}**](${config.baseUrl}/votes/${voting._id}) ${
                    voting.isPublic ? "available for **public** viewing" : "private"
                }`,
                color: voting.isPublic ? webhookColors.lightPurple : webhookColors.darkPurple,
            },
        ]);
    }
}

export default new VotingsController();
