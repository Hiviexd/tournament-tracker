import { Document } from "mongoose";
import { IUser } from "./User";
import { IVote } from "./Vote";

export enum TournamentType {
    Tournament = "tournament",
    Contest = "contest",
}

export enum TournamentStatus {
    SpportRequestReceived = "supportRequestReceived",
    ScreeningOngoing = "screeningOngoing",
    ScreeningConcluded = "screeningConcluded",
    ReviewOngoing = "reviewOngoing",
    ChangesRequested = "changesRequested",
    BadgeApproved = "badgeApproved",
    BadgeRejected = "badgeRejected",
}

export interface ITournament extends Document {
    name: string;
    description: string;
    startDate: Date;
    endDate: Date;
    forumUrl: string;
    host: IUser;
    type: TournamentType;
    bannerUrl?: string;
    badges: string[];
    assignedReviewers: IUser[];
    reviews: IVote[];
    status: TournamentStatus;
    isActive: boolean;

    // virtuals
    isTournament: boolean;
    isContest: boolean;
}
