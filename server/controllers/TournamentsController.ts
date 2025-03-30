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
        select: "username osuId groups coverUrl",
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

    /** POST reassign reviewer */
    public async reassignReviewer(req: Request, res: Response) {
        const tournamentId = req.params.tournamentId;
        const { oldReviewerId, newReviewerId } = req.body;

        if (!oldReviewerId || !newReviewerId) {
            return res.json({ error: "Both old and new reviewer IDs are required" });
        }

        // Find tournament without populating first to check and get a proper reference
        const tournament = await Tournament.findById(tournamentId).orFail();

        if (!tournament.assignedReviewers || tournament.assignedReviewers.length === 0) {
            return res.json({ error: "Tournament has no assigned reviewers" });
        }

        // Check if old reviewer is actually assigned
        const oldReviewerIndex = tournament.assignedReviewers.findIndex(
            (reviewer) => reviewer.toString() === oldReviewerId
        );

        if (oldReviewerIndex === -1) {
            return res.json({ error: "Old reviewer is not assigned to this tournament" });
        }

        // Get and validate new reviewer
        const newReviewer = await User.findById(newReviewerId).orFail();

        // Check if new reviewer has the correct group
        const reviewerTypeMap: { [key in TournamentType]: UserGroup } = {
            tournament: "tc",
            contest: "cc",
        };
        const requiredGroup = reviewerTypeMap[tournament.type];
        if (!newReviewer.groups.includes(requiredGroup)) {
            return res.json({
                error: `New reviewer must be a member of ${requiredGroup.toUpperCase()}`,
            });
        }

        // Check if new reviewer is already assigned
        if (tournament.assignedReviewers.some((reviewer) => reviewer.toString() === newReviewerId)) {
            return res.json({ error: "New reviewer is already assigned to this tournament" });
        }

        // Instead of direct array manipulation, use mongoose's array update methods
        // Create a new array with the updated reviewer
        const updatedReviewers = [...tournament.assignedReviewers];
        updatedReviewers[oldReviewerIndex] = newReviewerId;

        // Update the tournament with the new array
        await Tournament.findByIdAndUpdate(
            tournamentId,
            { assignedReviewers: updatedReviewers },
            { new: true, runValidators: true }
        );

        res.json({ message: "Reviewer reassigned successfully!" });

        // TODO: logging and discord
    }
}

export default new TournamentsController();
