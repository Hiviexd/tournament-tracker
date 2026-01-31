import { Request, Response } from "express";
import Tournament from "../models/tournamentModel";
import Voting from "../models/votingModel";
import Ticket from "../models/ticketModel";
import User from "../models/userModel";
import { IDashboardResponse } from "../../interfaces/Dashboard";
import { InfringementType, IUser } from "../../interfaces/User";

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

        // query non-note infringements that don't have an enchantUrl
        const users = await User.find({
            infringements: {
                $elemMatch: {
                    type: {
                        $in: [
                            InfringementType.HOSTING_BAN,
                            InfringementType.STAFFING_BAN,
                            InfringementType.TOURNAMENT_BAN,
                            InfringementType.PROBATION,
                            InfringementType.WARNING,
                        ],
                    },
                    enchantUrl: { $exists: false },
                },
            },
        }).sort({ createdAt: -1 });

        // go through each user, and remove note infringements and any infringements that have an enchantUrl
        const filteredUsers = users.map((user) => {
            const userObject = typeof user.toObject === "function" ? user.toObject() : user;
            userObject.infringements = (userObject.infringements || []).filter(
                (i) => i.type !== InfringementType.NOTE && i.enchantUrl === undefined,
            );
            return userObject;
        });

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
