import Tournament from "../models/tournamentModel";
import UserService from "../services/UserService";
import { TournamentQueryParams, TournamentType, TournamentStatus } from "../../interfaces/Tournament";
import { UserGroup } from "../../interfaces/User";
import User from "../models/userModel";

const defaultPopulate = [
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

const defaultLimit = 20;

const selectFields = (isCommittee: boolean) => (isCommittee ? "" : "-reviews -assignedReviewers");

class TournamentsController {
    /** GET tournament listing */
    public async index(req, res) {
        const { name, mode, hostId, type, status, active, page = 1 } = req.query;
        const query: TournamentQueryParams = {};

        if (name) query.name = new RegExp(name, "i");
        if (mode) query.modes = { $in: [mode] };
        if (hostId && hostId.length) {
            const hostUser = await User.findByUsernameOrOsuId(hostId);
            query.host = hostUser || null;
        }
        if (type) query.type = type;
        if (status) query.status = status;
        if (active) query.isActive = status === "active";

        const skip = (Number(page) - 1) * defaultLimit;
        const isCommittee = res.locals.user.isCommittee;

        const [tournaments, total] = await Promise.all([
            Tournament.find(query)
                .select(selectFields(isCommittee))
                .populate(defaultPopulate)
                .skip(skip)
                .limit(defaultLimit),
            Tournament.countDocuments(query),
        ]);

        res.json({
            tournaments,
            total,
            page: Number(page),
            pages: Math.ceil(total / defaultLimit),
        });
    }

    /** GET tournament */
    public async getTournament(req, res) {
        const tournamentId = req.params.tournamentId;
        const isCommittee = res.locals.user.isCommittee;

        const tournament = await Tournament.findById(tournamentId)
            .select(selectFields(isCommittee))
            .populate(defaultPopulate);

        res.json(tournament);
    }

    /** POST create a tournament */
    public async create(req, res) {
        const { name, hostId, modes, type, bannerUrl, forumUrl, startDate, endDate } =
            req.body;

        const host = await User.findById(hostId).orFail();

        const status: TournamentStatus = "supportRequestReceived";

        const tournament = new Tournament({
            name,
            host,
            modes,
            type,
            status,
            bannerUrl,
            forumUrl,
            startDate,
            endDate,
        });

        await tournament.save();

        res.json(tournament);

        // TODO: logging and discord
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
