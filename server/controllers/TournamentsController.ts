import Tournament from "../models/tournamentModel";
import UserService from "../services/UserService";
import { TournamentQueryParams, TournamentType } from "../../interfaces/Tournament";
import { UserGroup } from "../../interfaces/User";
import User from "../models/userModel";

class TournamentsController {
    private defaultPopulate = [
        {
            path: "host",
            select: "username osuId",
        },
        {
            path: "assignedReviewers",
            select: "username osuId",
        },
        {
            path: "reviews",
            select: "content author vote",
            populate: {
                path: "author",
                select: "username osuId",
            },
        },
    ];

    private defaultLimit = 20;

    private selectFields = (isCommittee: boolean) => isCommittee ? "" : "-reviews -assignedReviewers";

    /** GET tournament listing */
    public async index(req, res) {
        const { name, host, type, status, isActive, page = 1 } = req.query;
        const query: TournamentQueryParams = {};

        if (name) query.name = new RegExp(name, "i");
        if (type) query.type = type;
        if (status) query.status = status;
        if (isActive !== undefined) query.isActive = isActive === "true";
        if (host) {
            const hostUser = await User.findByUsernameOrOsuId(host);
            query.host = hostUser;
        }

        const skip = (Number(page) - 1) * this.defaultLimit;
        const isCommittee = res.locals.user.isCommittee;

        const [tournaments, total] = await Promise.all([
            Tournament
                .find(query)
                .select(this.selectFields(isCommittee))
                .populate(this.defaultPopulate)
                .skip(skip)
                .limit(this.defaultLimit),
            Tournament.countDocuments(query)
        ]);

        res.json({
            tournaments,
            total,
            page: Number(page),
            pages: Math.ceil(total / this.defaultLimit)
        });
    }

    /** GET tournament */
    public async get(req, res) {
        const tournamentId = req.params.tournamentId;

        const tournament = await Tournament
            .findById(tournamentId)
            .select(this.selectFields(res.locals.user.isCommittee))
            .populate(this.defaultPopulate);

        res.json(tournament);
    }

    /** POST assign reviewers */
    public async assignReviewers(req, res) {
        const tournamentId = req.params.tournamentId;

        const tournament = await Tournament.findById(tournamentId).orFail();

        const reviewerTypeMap: { [key in TournamentType]: UserGroup } = {
            tournament: "tc",
            contest: "cc",
        };

        const assignedReviewersType = reviewerTypeMap[tournament.type];

        const reviewers = await UserService.assignReviewers(assignedReviewersType);

        tournament.assignedReviewers = reviewers;

        await tournament.save();

        res.json(tournament);
    }
}

export default new TournamentsController();
