import Voting from "../models/votingModel";
import Vote from "../models/voteModel";
import { VotingQueryParams, VotingListQuery } from "../../interfaces/Voting";
import User from "../models/userModel";
import Tournament from "../models/tournamentModel";
import { IUser } from "../../interfaces/User";
import { ITournament } from "../../interfaces/Tournament";
import { IDiscordField } from "@interfaces/Discord";
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
        const { category, assignedGroups, title, description, duration, options, targetUserId, targetTournamentId } =
            req.body;
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
            message: "Voting created successfully!",
            voting,
        });

        // Logger
        await LogService.generate(
            req.session.mongoId!,
            `Created a new **${voting.category}** voting: [**${voting.title}**](${config.discord.baseUrl}/votings/${voting._id})`,
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
                value: `[**${voting.targetTournament.name}**](${config.discord.baseUrl}/tournaments/${voting.targetTournament.id})`,
            });
        }

        fields.push({
            name: "Description",
            value: helpers.shorten(voting.description, 1024),
        });

        await DiscordService.sendRoleHighlightWebhook(roles, [
            {
                author: DiscordService.defaultWebhookAuthor(req.session),
                description: `Created a new **${voting.category}** voting: [**${voting.title}**](${config.discord.baseUrl}/votings/${voting._id})`,
                color: webhookColors.lightYellow,
                fields,
            },
        ]);
    }

    /** POST submit vote */
    public async submitVote(req: Request, res: Response) {
        const votingId = req.params.votingId;
        const { option, comment } = req.body;

        const author = res.locals!.user!;
        const voting = await Voting.findById(votingId).populate("votes").orFail();

        if (!voting.isActive) {
            return res.json({ message: "Voting is not active" });
        }

        if (option < 0 || option >= voting.options.length) {
            return res.json({ message: "Invalid option" });
        }

        let vote = voting.votes.find((vote) => vote.author.equals(author._id));
        let isNewVote = false;

        if (!vote) {
            vote = new Vote({ author, option, comment });
            isNewVote = true;
        } else {
            vote.option = option;
            vote.comment = comment;
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
                `Submitted a vote for [**${voting.title}**](${config.discord.baseUrl}/votings/${voting._id})`,
                "voting"
            );

            // Discord
            await DiscordService.sendWebhook([
                {
                    author: DiscordService.defaultWebhookAuthor(req.session),
                    description: `Submitted a vote for [**${voting.title}**](${config.discord.baseUrl}/votings/${voting._id})`,
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
            message: `Voting status is now ${voting.isActive ? "active" : "inactive"}`,
        });

        // Logger
        await LogService.generate(
            req.session.mongoId!,
            `Toggled voting status for [**${voting.title}**](${config.discord.baseUrl}/votings/${voting._id}) to ${
                voting.isActive ? "active" : "inactive"
            }`,
            "voting"
        );

        // Discord
        const getVotingOptionStats = (optionIndex: number) => {
            const votes = voting.votes.filter((vote) => vote.option === optionIndex).length;
            const percentage = voting.votes.length ? Math.round((votes / voting.votes.length) * 100) : 0;

            return { votes, percentage };
        };

        const getWinningOption = () => {
            // reduce votes to an array of vote options
            const voteOptions = voting.options.map((_, index) => getVotingOptionStats(index).votes);
            const maxVotes = Math.max(...voteOptions);

            return voting.options[voteOptions.indexOf(maxVotes)];
        };

        const results = voting.options
            .map(
                (option, index) =>
                    `- **${option}** - ${getVotingOptionStats(index).percentage}% (${
                        getVotingOptionStats(index).votes
                    }/${voting.votes.length})`
            )
            .join("\n");

        await DiscordService.sendWebhook([
            {
                author: DiscordService.defaultWebhookAuthor(req.session),
                description: `${voting.isActive ? "Resumed" : "Concluded"} voting for [**${voting.title}**](${
                    config.discord.baseUrl
                }/votings/${voting._id})`,
                color: voting.isActive ? webhookColors.yellow : webhookColors.darkYellow,
                fields: !voting.isActive
                    ? [
                        {
                            name: "Results",
                            value: helpers.shorten(results, 1024),
                        },
                        {
                            name: "Winning option",
                            value: getWinningOption(),
                        },
                    ] : [],
            },
        ]);
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
        voting.options = options;

        await voting.save();

        res.json({
            message: "Voting updated successfully!",
            voting,
        });

        // Logger
        await LogService.generate(
            req.session.mongoId!,
            `Updated the voting: [**${voting.title}**](${config.discord.baseUrl}/votings/${voting._id})`,
            "voting"
        );
    }

    /** POST delete a voting */
    public async deleteVoting(req: Request, res: Response) {
        const votingId = req.params.votingId;

        const voting = await Voting.findById(votingId).orFail();

        if (!voting.isActive) {
            return res.json({ error: "Cannot delete concluded votings!" });
        }

        if (voting.votes.length && !res.locals!.user!.isAdmin) {
            return res.json({ error: "Cannot delete voting with votes!" });
        }

        await voting.remove();

        res.json({
            message: "Voting deleted successfully!",
        });

        // Logger
        await LogService.generate(
            req.session.mongoId!,
            `Deleted the voting [**${voting.title}**](${config.discord.baseUrl}/votings/${voting._id})`,
            "voting"
        );

        // Discord
        await DiscordService.sendWebhook([
            {
                author: DiscordService.defaultWebhookAuthor(req.session),
                description: `Deleted a voting: [**${voting.title}**](${config.discord.baseUrl}/votings/${voting._id})`,
                color: webhookColors.darkRed,
            },
        ]);
    }
}

export default new VotingsController();
