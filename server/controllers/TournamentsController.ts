import Tournament from "../models/tournamentModel";
import UsersController from "./UsersController";
import { TournamentType } from "../../interfaces/Tournament";
import { UserGroup } from "../../interfaces/User";

class TournamentsController {
    // ? Util methods
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

    private selectFields = (isCommittee: boolean) => isCommittee ? "" : "-reviews -assignedReviewers";

    // ? API methods
    /** GET tournament listing */
    public async index(req, res) {
        const { name, host, type, status, isActive, limit } = req.query;
        const query: any = {};

        if (name) query.name = new RegExp(name, "i");
        if (host) query.host = host;
        if (type) query.type = type;
        if (status) query.status = status;
        if (isActive !== undefined) query.isActive = isActive === "true";
        if (!limit) query.limit = 20;

        const isCommittee = res.locals.user.isCommittee;

        const tournaments = await Tournament
            .find(query)
            .limit(limit)
            .select(this.selectFields(isCommittee))
            .populate(this.defaultPopulate);
        res.json(tournaments);
    }

    /** GET tournament */
    public async get(req, res) {
        const tournament = await Tournament
            .findById(req.params.tournamentId)
            .select(this.selectFields(res.locals.user.isCommittee))
            .populate(this.defaultPopulate);

        res.json(tournament);
    }

    /** POST assign reviewers */
    public async assignReviewers(req, res) {
        const tournament = await Tournament.findById(req.params.tournamentId).orFail();

        const reviewerTypeMap: { [key in TournamentType]: UserGroup } = {
            tournament: "tc",
            contest: "cc",
        };

        const assignedReviewersType = reviewerTypeMap[tournament.type];

        const reviewers = await UsersController.assignReviewers(assignedReviewersType);

        tournament.assignedReviewers = reviewers;

        await tournament.save();

        res.json(tournament);
    }
}

export default new TournamentsController();
