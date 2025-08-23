import { Request, Response } from "express";
import Tournament from "../models/tournamentModel";
import Voting from "../models/votingModel";
import Ticket from "../models/ticketModel";
import { IDashboardResponse } from "../../interfaces/Dashboard";

const TOURNAMENT_POPULATE = [
    {
        path: "host",
        select: "username osuId groups coverUrl country",
    },
    {
        path: "assignedReviewers",
        select: "username osuId groups coverUrl isActiveReviewer country",
    },
    {
        path: "reviews",
        select: "comment author vote checklist createdAt updatedAt",
        populate: {
            path: "author",
            select: "username osuId groups coverUrl country",
        },
    },
];

const VOTING_POPULATE = [
    { path: "author", select: "username osuId groups coverUrl country" },
    {
        path: "votes",
        populate: {
            path: "author",
            select: "username osuId groups coverUrl",
        },
    },
    { path: "targetUser", select: "username osuId groups coverUrl country" },
    { path: "abstainedUsers", select: "username osuId groups coverUrl country" },
];

const TICKET_POPULATE = [
    { path: "author", select: "username osuId groups coverUrl country" },
    {
        path: "messages",
        populate: [
            {
                path: "author",
                select: "username osuId groups discordId coverUrl country",
            },
            { path: "attachments", select: "originalName url size type" },
        ],
    },
    { path: "targetUser", select: "username osuId groups coverUrl country" },
];

class DashboardController {
    /** GET dashboard data */
    public async index(_: Request, res: Response) {
        const user = res.locals!.user;

        // query tournaments that the user is involved in
        const tournaments = await Tournament.find({
            assignedReviewers: user?._id,
            status: { $in: ["reviewOngoing", "changesRequested"] },
            isActive: true,
        })
            .sort({ startedReviewAt: 1 })
            .populate(TOURNAMENT_POPULATE);

        // query active votings that the user is involved in
        const votings = await Voting.find({
            isActive: true,
            assignedGroups: { $in: user?.groups },
        })
            .sort({ createdAt: -1 })
            .populate(VOTING_POPULATE);

        // query active tickets that the user is involved in
        const tickets = await Ticket.find({
            type: "ticket",
            isActive: true,
            assignedGroup: { $in: user?.groups },
        })
            .sort({ createdAt: -1 })
            .populate(TICKET_POPULATE);

        // query reports that the user is involved in
        const reports = await Ticket.find({
            type: "report",
            isActive: true,
            assignedGroup: { $in: user?.groups },
        })
            .sort({ createdAt: -1 })
            .populate(TICKET_POPULATE);

        const response: IDashboardResponse = {
            tournaments,
            votings,
            reports,
            tickets,
        };

        res.json(response);
    }
}

export default new DashboardController();
