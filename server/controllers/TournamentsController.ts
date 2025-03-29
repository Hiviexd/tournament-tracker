import { Request, Response } from "express";
import Tournament from "../models/tournamentModel";
import UserService from "../services/UserService";
import { TournamentQueryParams, TournamentType, TournamentStatus, GameMode } from "../../interfaces/Tournament";
import { UserGroup } from "../../interfaces/User";
import User from "../models/userModel";
import UploadService from "../services/UploadService";

const defaultPopulate = [
    {
        path: "host",
        select: "username osuId groups",
    },
    {
        path: "assignedReviewers",
        select: "username osuId groups",
    },
    {
        path: "reviews",
        select: "content author vote",
        populate: {
            path: "author",
            select: "username osuId groups",
        },
    },
    {
        path: "banner",
        select: "url",
    },
];

const DEFAULT_LIMIT = 20;

const FILE_UPLOAD_CATEGORY = "tournaments";

const selectFields = (isCommittee: boolean) => (isCommittee ? "" : "-reviews -assignedReviewers");

class TournamentsController {
    /** GET tournament listing */
    public async index(req: Request, res: Response) {
        const { name, mode, host, type, status, state, page = 1 } = req.query;
        const query: TournamentQueryParams = {};

        console.log(host);

        if (name) query.name = new RegExp(name as string, "i");
        if (mode) query.modes = { $in: [mode as GameMode] };
        if (host) {
            const hostUser = await User.findByUsernameOrOsuId(host as string);
            if (hostUser) query.host = hostUser._id;
        }
        if (type) query.type = type as TournamentType;
        if (status) query.status = status as TournamentStatus;
        if (state) query.isActive = state === "active";

        const skip = (Number(page) - 1) * DEFAULT_LIMIT;
        const isCommittee = res.locals!.user!.isCommittee;

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
    public async getTournament(req: Request, res: Response) {
        const tournamentId = req.params.tournamentId;
        const isCommittee = res.locals!.user!.isCommittee;

        const tournament = await Tournament.findById(tournamentId)
            .select(selectFields(isCommittee))
            .populate(defaultPopulate);

        res.json(tournament);
    }

    /** POST create a tournament */
    public async create(req: Request, res: Response) {
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

        if (files?.length) {
            const banner = await UploadService.handleFileUploads(files, FILE_UPLOAD_CATEGORY, tournament._id, host._id);

            tournament.banner = banner[0];
        }

        await tournament.save();

        res.json({ message: "Tournament created successfully!", tournament });

        // TODO: logging and discord
    }

    /** POST assign reviewers */
    public async assignReviewers(req: Request, res: Response) {
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

        res.json({ message: "Reviewers assigned successfully!" });

        // TODO: logging and discord
    }

    /** POST edit tournament */
    public async edit(req: Request, res: Response) {
        const tournamentId = req.params.tournamentId;
        const { forumUrl, startDate, endDate, status, isActive } = req.body;

        const tournament = await Tournament.findById(tournamentId).orFail();

        if (forumUrl) tournament.forumUrl = forumUrl;
        if (startDate) tournament.startDate = startDate;
        if (endDate) tournament.endDate = endDate;
        if (status) tournament.status = status;
        if (isActive !== undefined) tournament.isActive = isActive;

        await tournament.save();

        res.json({ message: "Tournament updated successfully!" });

        // TODO: logging
    }
}

export default new TournamentsController();
