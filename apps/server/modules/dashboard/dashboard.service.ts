import { TICKET_MODEL, TOURNAMENT_MODEL, VOTING_MODEL } from "../common/database.tokens";
import type { ITicket } from "@tc/types/Ticket";
import type { IVoting } from "@tc/types/Voting";
import type { ITournament } from "@tc/types/Tournament";
import type { Model } from "mongoose";
import { Inject, Injectable } from "@nestjs/common";
import type { IDashboardResponse } from "@tc/types/Dashboard";
import type { IUser } from "@tc/types/User";
import { InfringementService } from "../../services/InfringementService";

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

@Injectable()
export class DashboardService {
    constructor(
        @Inject(TOURNAMENT_MODEL) private readonly tournamentModel: Model<ITournament>,
        @Inject(VOTING_MODEL) private readonly votingModel: Model<IVoting>,
        @Inject(TICKET_MODEL) private readonly ticketModel: Model<ITicket>,
        private readonly infringementService: InfringementService
    ) {}

    async index(user: IUser | undefined): Promise<IDashboardResponse> {
        const allReviewTournaments = await this.tournamentModel.find({
            status: { $in: ["reviewOngoing", "changesRequested"] },
            isActive: true,
            type: user?.isTournamentCommittee ? "tournament" : "contest",
        })
            .sort({ startedReviewAt: 1 })
            .populate(TOURNAMENT_POPULATE);

        const userAssignedTournaments = allReviewTournaments.filter((tournament) =>
            tournament.assignedReviewers?.some((reviewer: IUser) => reviewer._id.equals(user?._id)),
        );

        const inactiveReviewerTournaments = allReviewTournaments.filter((tournament) =>
            tournament.assignedReviewers?.some((reviewer: IUser) => reviewer.isActiveReviewer === false),
        );

        const votings = await this.votingModel.find({
            isActive: true,
            assignedGroups: { $in: user?.groups },
        })
            .sort({ createdAt: -1 })
            .populate(VOTING_POPULATE);

        const tickets = await this.ticketModel.find({
            type: "ticket",
            isActive: true,
            assignedGroup: { $in: user?.groups },
        })
            .sort({ createdAt: -1 })
            .populate(TICKET_POPULATE);

        const reports = await this.ticketModel.find({
            type: "report",
            isActive: true,
            assignedGroup: { $in: user?.groups },
        })
            .sort({ createdAt: -1 })
            .populate(TICKET_POPULATE);

        const filteredUsers = await this.infringementService.getInfringementsNeedingEmail();

        return {
            tournaments: userAssignedTournaments,
            inactiveReviewerTournaments,
            votings,
            reports,
            tickets,
            users: filteredUsers,
        };
    }
}
