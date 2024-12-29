import Voting from "../models/votingModel";
import Vote from "../models/voteModel";
import { VotingQueryParams } from "../../interfaces/Voting";
import User from "../models/userModel";
import Tournament from "../models/tournamentModel";

class VotingController {
    private defaultPopulate = [
        {
            path: "votes",
            populate: {
                path: "author",
                select: "username osuId groups"
            },
        },
        { path: "author", select: "username osuId groups" },
        { path: "targetUser", select: "username osuId" },
        { path: "targetTournament", select: "name" },
    ];

    private defaultLimit = 20;

    /** GET voting listing */
    public async index(req, res) {
        const { title, author, category, isActive, page = 1 } = req.query;
        const query: VotingQueryParams = {};

        if (title) query.title = new RegExp(title, "i");
        if (author) {
            const authorUser = await User.findByUsernameOrOsuId(author);
            query.author = authorUser;
        }
        if (category) query.category = category;
        if (isActive !== undefined) query.isActive = isActive === "true";

        const skip = (Number(page) - 1) * this.defaultLimit;

        const [votings, total] = await Promise.all([
            Voting
                .find(query)
                .populate(this.defaultPopulate)
                .skip(skip)
                .limit(this.defaultLimit),
            Voting.countDocuments(query)
        ]);

        res.json({
            votings,
            total,
            page: Number(page),
            pages: Math.ceil(total / this.defaultLimit),
        });
    }

    /** GET a voting */
    public async getVoting(req, res) {
        const votingId = req.params.votingId;

        const voting = await Voting.findById(votingId).populate(this.defaultPopulate).orFail();

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
        const targetUser = await User.findByUsernameOrOsuId(targetUserId);
        const targetTournament = await Tournament.findById(targetTournamentId);

        const voting = new Voting({
            author,
            category,
            assignedGroups,
            title,
            description,
            duration,
            options,
            targetUser,
            targetTournament,
        });

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

        let vote = voting.votes.find(vote => vote.author.equals(author._id));
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
        const {
            title,
            description,
            duration,
            options,
        } = req.body;

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

        voting.votes = voting.votes.filter(vote => !vote.equals(voteId));

        await voting.save();

        res.json({
            message: "Vote deleted successfully",
            voting,
        });

        // TODO logging and webhook
    }
}

export default new VotingController();
