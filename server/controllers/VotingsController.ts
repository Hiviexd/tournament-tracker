import Voting from "../models/votingModel";
import Vote from "../models/voteModel";
import { VotingQueryParams, VotingListQuery } from "../../interfaces/Voting";
import User from "../models/userModel";
import Tournament from "../models/tournamentModel";
import { IUser } from "../../interfaces/User";
import { ITournament } from "../../interfaces/Tournament";
import { IDiscordField } from "@interfaces/Discord";
import { IVote, BinaryVote, VariableVote } from "@interfaces/Vote";
import DiscordService from "../services/DiscordService";
import webhookColors from "../constants/webhookColors";
import config from "../../config.json";
import LogService from "../services/LogService";
import helpers from "../helpers";
import { Request, Response } from "express";
import UploadService from "../services/UploadService";

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

        if (reqQuery.title) dbQuery.title = new RegExp(reqQuery.title, "i");
        if (reqQuery.category) dbQuery.category = reqQuery.category;
        if (reqQuery.assignedGroup) dbQuery.assignedGroups = { $in: [reqQuery.assignedGroup] };
        if (reqQuery.status) dbQuery.isActive = reqQuery.status === "active";

        const page = Number(reqQuery.page || 1);
        const skip = (page - 1) * DEFAULT_LIMIT;

        const [votings, total] = await Promise.all([
            Voting.find(dbQuery).skip(skip).limit(DEFAULT_LIMIT).sort({ createdAt: -1 }).populate(DEFAULT_POPULATE),
            Voting.countDocuments(dbQuery),
        ]);

        res.json({
            votings,
            total,
            page: Number(page),
            pages: Math.ceil(total / DEFAULT_LIMIT),
        });
    }

    /** GET a voting */
    public async getVoting(req: Request, res: Response) {
        const votingId = req.params.votingId;

        const voting = await Voting.findById(votingId).populate(DEFAULT_POPULATE).orFail();

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
            targetTournamentId,
            type,
        } = req.body;
        const files = req.files as Express.Multer.File[];

        const author = res.locals!.user!;
        let targetUser: IUser, targetTournament: ITournament;

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

        if (targetUserId) {
            targetUser = await User.findById(targetUserId).orFail();
            voting.targetUser = targetUser;
        }

        if (targetTournamentId) {
            targetTournament = await Tournament.findById(targetTournamentId).orFail();
            voting.targetTournament = targetTournament;
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

        if (voting.targetTournament) {
            fields.push({
                name: "Target Tournament",
                value: `[**${voting.targetTournament.name}**](${config.baseUrl}/tournaments/${voting.targetTournament.id})`,
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
            const getVotingResults = () => {
                switch (voting.type) {
                    case "classic": {
                        const optionCounts = voting.options.map((option, index) => {
                            const votes = voting.votes.filter(
                                (v) => v.data.type === "classic" && v.data.option === index
                            ).length;
                            const percentage = voting.votes.length
                                ? Math.round((votes / voting.votes.length) * 100)
                                : 0;
                            return { option, votes, percentage };
                        });

                        const maxVotes = Math.max(...optionCounts.map((o) => o.votes));
                        const winners = optionCounts.filter((o) => o.votes === maxVotes);

                        return {
                            results: optionCounts
                                .map((o) => `- **${o.option}** - ${o.percentage}% (${o.votes}/${voting.votes.length})`)
                                .join("\n"),
                            winners: winners.map((w) => w.option).join(", "),
                        };
                    }

                    case "binary": {
                        const scores = voting.votes
                            .filter((v): v is IVote & { data: BinaryVote } => v.data.type === "binary")
                            .map((v) => v.data.score);

                        const avgScore = scores.length
                            ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2)
                            : "N/A";

                        return {
                            results:
                                `Average score: **${avgScore}** (${scores.length} votes)\n\n` +
                                `Distribution:\n` +
                                `- ${voting.options[0]} (1 to 5): ${scores.filter((s) => s > 0).length}\n` +
                                `- Neutral (0): ${scores.filter((s) => s === 0).length}\n` +
                                `- ${voting.options[1]} (-5 to -1): ${scores.filter((s) => s < 0).length}`,
                            winners: `Average: ${avgScore}`,
                        };
                    }

                    case "variable": {
                        const optionScores = voting.options.map((option, index) => {
                            const scores = voting.votes
                                .filter((v): v is IVote & { data: VariableVote } => v.data.type === "variable")
                                .map((v) => v.data.scores.find((s) => s.optionIndex === index)?.score ?? 0);

                            const avgScore = scores.length
                                ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2)
                                : "N/A";

                            return { option, avgScore, votes: scores.length };
                        });

                        const maxScore = Math.max(...optionScores.map((o) => Number(o.avgScore)));
                        const winners = optionScores.filter((o) => Number(o.avgScore) === maxScore);

                        return {
                            results: optionScores
                                .map((o) => `- **${o.option}** - Avg: ${o.avgScore} (${o.votes} votes)`)
                                .join("\n"),
                            winners: winners.map((w) => w.option).join(", "),
                        };
                    }
                }
            };

            const { results, winners } = getVotingResults();

            await DiscordService.sendWebhook([
                {
                    author: DiscordService.defaultWebhookAuthor(req.session),
                    description: `Concluded vote for [**${voting.title}**](${config.baseUrl}/votes/${voting._id})`,
                    color: webhookColors.darkYellow,
                    fields: [
                        {
                            name: "Vote Type",
                            value: `*${voting.type}*`,
                            inline: true,
                        },
                        {
                            name: "Total Votes",
                            value: `${voting.votes.length}`,
                            inline: true,
                        },
                        {
                            name: "Results",
                            value: helpers.shorten(results, 1024),
                        },
                        {
                            name: voting.type === "binary" ? "Final Score" : "Winner(s)",
                            value: winners,
                        },
                    ],
                },
            ]);
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

        if (voting.votes.length && !res.locals!.user!.isAdmin) {
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
}

export default new VotingsController();
