import Voting from "../models/votingModel";
import Vote from "../models/voteModel";
import { VotingQueryParams } from "../../interfaces/Voting";
import User from "../models/userModel";
import Tournament from "../models/tournamentModel";
import { IUser } from "../../interfaces/User";
import { ITournament } from "../../interfaces/Tournament";

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

const DEFAULT_LIMIT = 20;

class VotingController {
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
        const requiredVotes = Math.ceil(0.8 * assignedUsersCount);

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
            message: "Voting created successfully",
            voting,
        });

        // TODO logging and webhook
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
            message: "Vote submitted successfully",
            voting,
        });

        // TODO logging and webhook (for new votes)
    }

    /** POST toggle voting status */
    public async toggleVotingStatus(req, res) {
        const votingId = req.params.votingId;

        const voting = await Voting.findById(votingId).orFail();

        voting.isActive = !voting.isActive;

        await voting.save();

        res.json({
            message: `Voting status is now ${voting.isActive ? "active" : "inactive"}`,
        });

        // TODO logging and webhook
    }

    /** POST update a voting */
    public async updateVoting(req, res) {
        const votingId = req.params.votingId;
        const { title, description, duration, options } = req.body;

        const voting = await Voting.findById(votingId).orFail();

        if (!voting.isActive) {
            return res.json({ message: "Cannot edit inactive votes!" });
        }

        voting.title = title;
        voting.description = description;
        voting.duration = duration;
        voting.options = options;

        await voting.save();

        res.json({
            message: "Voting updated successfully",
            voting,
        });

        // TODO logging and webhook
    }

    /** POST delete a voting */
    public async deleteVoting(req, res) {
        const votingId = req.params.votingId;

        const voting = await Voting.findById(votingId).orFail();

        if (voting.votes.length > 0 && !res.locals.user.isAdmin) {
            return res.json({ message: "Cannot delete voting with votes!" });
        }

        await voting.remove();

        res.json({
            message: "Voting deleted successfully",
        });

        // TODO logging and webhook
    }

    /** POST delete a vote */
    public async deleteVote(req, res) {
        const { votingId, voteId } = req.params;

        const voting = await Voting.findById(votingId).orFail();

        voting.votes = voting.votes.filter((vote) => !vote.equals(voteId));

        await voting.save();

        res.json({
            message: "Vote deleted successfully",
            voting,
        });

        // TODO logging and webhook
    }
}

export default new VotingController();
