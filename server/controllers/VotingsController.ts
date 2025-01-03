import Voting from "../models/votingModel";
import Vote from "../models/voteModel";
import { VotingQueryParams } from "../../interfaces/Voting";
import User from "../models/userModel";
import Tournament from "../models/tournamentModel";
import { IUser } from "../../interfaces/User";
import { ITournament } from "../../interfaces/Tournament";
import DiscordService from "../services/DiscordService";
import webhookColors from "../helpers/constants/webhookColors";
import config from "../../config.json";
import LogService from "../services/LogService";
import helpers from "../helpers";

const DEFAULT_POPULATE = [
    { path: "author", select: "username osuId groups" },
    {
        path: "votes",
        populate: {
            path: "author",
            select: "username osuId groups",
        },
    },
    { path: "targetUser", select: "username osuId" },
    { path: "targetTournament", select: "name" },
];

const DEFAULT_LIMIT = 10;

const STRICT_PARTICIPATION_PERCENTAGE = 0.75;

class VotingsController {
    /** GET voting listing */
    public async index(req, res) {
        const { title, category, assignedGroup, status, page = 1 } = req.query;
        const query: VotingQueryParams = {};

        if (title) query.title = new RegExp(title, "i");
        if (category) query.category = category;
        if (assignedGroup) query.assignedGroups = { $in: [assignedGroup] };
        if (status) query.isActive = status === "active";

        const skip = (Number(page) - 1) * DEFAULT_LIMIT;

        const [votings, total] = await Promise.all([
            Voting.find(query)
                .skip(skip)
                .limit(DEFAULT_LIMIT)
                .sort({ createdAt: -1 })
                .populate(DEFAULT_POPULATE),
            Voting.countDocuments(query),
        ]);

        res.json({
            votings,
            total,
            page: Number(page),
            pages: Math.ceil(total / DEFAULT_LIMIT),
        });
    }

    /** GET a voting */
    public async getVoting(req, res) {
        const votingId = req.params.votingId;

        const voting = await Voting.findById(votingId).populate(DEFAULT_POPULATE).orFail();

        res.json(voting);
    }

    /** POST create a voting */
    public async createVoting(req, res) {
        const {
            category,
            assignedGroups,
            title,
            description,
            duration,
            options,
            targetUserId,
            targetTournamentId,
        } = req.body;

        const author = res.locals.user;
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
            targetUser = await User.findByUsernameOrOsuId(targetUserId);
            voting.targetUser = targetUser;
        }

        if (targetTournamentId) {
            targetTournament = await Tournament.findById(targetTournamentId).orFail();
            voting.targetTournament = targetTournament;
        }

        await voting.save();

        res.json({
            message: "Voting created successfully!",
            voting,
        });

        // Logger
        await LogService.generate(
            res.locals.user._id,
            `Created a new **${voting.category}** voting: [**${voting.title}**](${config.discord.baseUrl}/votings/${voting._id})`,
            "voting"
        );

        // Discord
        const roles: string[] = [];

        if (voting.assignedGroups.includes("tc")) roles.push("tournament");
        if (voting.assignedGroups.includes("cc")) roles.push("contest");

        await DiscordService.sendRoleHighlightWebhook(
            roles,
            [
                {
                    author: DiscordService.defaultWebhookAuthor(req.session),
                    description: `Created a new **${voting.category}** voting: [**${voting.title}**](${config.discord.baseUrl}/votings/${voting._id})`,
                    color: webhookColors.lightYellow,
                    fields: [
                        {
                            name: "Deadline",
                            value: `${helpers.discordTimestamp(voting.deadline)} (${helpers.discordTimestamp(voting.deadline, "dateTime")})`
                        },
                        {
                            name: "Description",
                            value: helpers.shorten(voting.description, 1024),
                        },
                    ],
                },
            ],
        );
    }

    /** POST submit vote */
    public async submitVote(req, res) {
        const votingId = req.params.votingId;
        const { option, comment } = req.body;

        const author = res.locals.user;
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
                res.locals.user._id,
                `Submitted a vote for [**${voting.title}**](${config.discord.baseUrl}/votings/${voting._id})`,
                "voting"
            );

            // Discord
            await DiscordService.sendWebhook(
                [
                    {
                        author: DiscordService.defaultWebhookAuthor(req.session),
                        description: `Submitted a vote for [**${voting.title}**](${config.discord.baseUrl}/votings/${voting._id})`,
                        color: webhookColors.lightGreen,
                    },
                ],
            );
        }
    }

    /** POST toggle voting status */
    public async toggleVotingStatus(req, res) {
        const votingId = req.params.votingId;

        const voting = await Voting.findById(votingId).populate("votes").orFail();

        voting.isActive = !voting.isActive;

        await voting.save();

        res.json({
            message: `Voting status is now ${voting.isActive ? "active" : "inactive"}`,
        });

        // Logger
        await LogService.generate(
            res.locals.user._id,
            `Toggled voting status for [**${voting.title}**](${config.discord.baseUrl}/votings/${voting._id}) to ${voting.isActive ? "active" : "inactive"}`,
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
        }

        const results = voting.options.map((option, index) => `- **${option}** - ${getVotingOptionStats(index).percentage}% (${getVotingOptionStats(index).votes}/${voting.votes.length})`).join("\n");

        await DiscordService.sendWebhook(
            [
                {
                    author: DiscordService.defaultWebhookAuthor(req.session),
                    description: `${voting.isActive ? "Resumed" : "Concluded"} voting for [**${voting.title}**](${config.discord.baseUrl}/votings/${voting._id})`,
                    color: voting.isActive ? webhookColors.yellow : webhookColors.darkYellow,
                    fields: !voting.isActive ?
                        [
                            {
                                name: "Results",
                                value: helpers.shorten(results, 1024),
                            },
                            {
                                name: "Winning option",
                                value: getWinningOption(),
                            }
                        ] : [],
                },
            ],
        );
    }

    /** POST update a voting */
    public async updateVoting(req, res) {
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
            res.locals.user._id,
            `Updated the voting: [**${voting.title}**](${config.discord.baseUrl}/votings/${voting._id})`,
            "voting"
        );
    }

    /** POST delete a voting */
    public async deleteVoting(req, res) {
        const votingId = req.params.votingId;

        const voting = await Voting.findById(votingId).orFail();

        if (!voting.isActive) {
            return res.json({ error: "Cannot delete concluded votings!" });
        }

        if (voting.votes.length && !res.locals.user.isAdmin) {
            return res.json({ error: "Cannot delete voting with votes!" });
        }

        await voting.remove();

        res.json({
            message: "Voting deleted successfully!",
        });

        // Logger
        await LogService.generate(
            res.locals.user._id,
            `Deleted the voting [**${voting.title}**](${config.discord.baseUrl}/votings/${voting._id})`,
            "voting"
        );

        // Discord
        await DiscordService.sendWebhook(
            [
                {
                    author: DiscordService.defaultWebhookAuthor(req.session),
                    description: `Deleted a voting: [**${voting.title}**](${config.discord.baseUrl}/votings/${voting._id})`,
                    color: webhookColors.darkRed,
                },
            ],
        );
    }
}

export default new VotingsController();
