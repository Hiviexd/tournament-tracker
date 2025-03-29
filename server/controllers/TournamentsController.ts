import Tournament from "../models/tournamentModel";
import UserService from "../services/UserService";
import { TournamentQueryParams, TournamentType, TournamentStatus } from "../../interfaces/Tournament";
import { UserGroup } from "../../interfaces/User";
import User from "../models/userModel";
import UploadService from "../services/UploadService";

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

const DEFAULT_LIMIT = 20;

const FILE_UPLOAD_CATEGORY = "tournaments";

const selectFields = (isCommittee: boolean) => (isCommittee ? "" : "-reviews -assignedReviewers");

class TournamentsController {
    /** GET tournament listing */
    public async index(req, res) {
        const { name, mode, hostId, type, status, state, page = 1 } = req.query;
        const query: TournamentQueryParams = {};

        if (name) query.name = new RegExp(name, "i");
        if (mode) query.modes = { $in: [mode] };
        if (hostId && hostId.length) {
            const hostUser = await User.findByUsernameOrOsuId(hostId);
            query.host = hostUser || null;
        }
        if (type) query.type = type;
        if (status) query.status = status;
        if (state) query.isActive = state === "active";

        const skip = (Number(page) - 1) * DEFAULT_LIMIT;
        const isCommittee = res.locals.user.isCommittee;

        const [tournaments, total] = await Promise.all([
            Tournament.find(query)
                .select(selectFields(isCommittee))
                .populate(defaultPopulate)
                .skip(skip)
                .limit(DEFAULT_LIMIT),
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
        const { name, hostId, modes, type, forumUrl, startDate, endDate } = req.body;
        const files = req.files as Express.Multer.File[];

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

        await tournament.save();

        if (files?.length) {
            tournament.banner = await UploadService.handleFileUploads(
                files,
                FILE_UPLOAD_CATEGORY,
                tournament._id,
                host._id
            )[0];
        }

        await tournament.save();

        res.json({ message: "Tournament created successfully!", tournament });

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
