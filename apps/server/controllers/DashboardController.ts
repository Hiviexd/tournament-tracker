import { Request, Response } from "express";
import Tournament from "@tc/models/tournamentModel";
import Voting from "@tc/models/votingModel";
import Ticket from "@tc/models/ticketModel";
import { IDashboardResponse } from "@tc/types/Dashboard";
import { IUser } from "@tc/types/User";
import InfringementService from "../services/InfringementService";

const TOURNAMENT_POPULATE = [
    {
        path: "hosts",
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

        const allReviewTournaments = await Tournament.find({
            status: { $in: ["reviewOngoing", "changesRequested"] },
            isActive: true,
            type: user?.isTournamentCommittee ? "tournament" : "contest",
        })
            .sort({ startedReviewAt: 1 })
            .populate(TOURNAMENT_POPULATE);

        // filter tournaments assigned to the user
        const userAssignedTournaments = allReviewTournaments.filter((tournament) =>
            tournament.assignedReviewers?.some((reviewer: IUser) => reviewer._id.equals(user?._id)),
        );

        // filter tournaments that have inactive reviewers assigned
        const inactiveReviewerTournaments = allReviewTournaments.filter((tournament) =>
            tournament.assignedReviewers?.some((reviewer: IUser) => reviewer.isActiveReviewer === false),
        );

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

        const filteredUsers = await InfringementService.getInfringementsNeedingEmail();

        const response: IDashboardResponse = {
            tournaments: userAssignedTournaments,
            inactiveReviewerTournaments,
            votings,
            reports,
            tickets,
            users: filteredUsers,
        };

        res.json(response);
    }
}

export default new DashboardController();
