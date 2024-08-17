import { Document } from "mongoose";
import { IUser } from "./User";
import { IVote } from "./Vote";
import { INote } from "./Note";

export enum TournamentType {
    Tournament = "tournament",
    Contest = "contest",
}

export enum TournamentStatus {
    SpportRequestReceived = "supportRequestReceived",
    ScreeningOngoing = "screeningOngoing",
    ScreeningConcluded = "screeningConcluded",
    ReviewOngoing = "reviewOngoing",
    BadgeApproved = "badgeApproved",
    BadgeRejected = "badgeRejected",
    BadgeNeedsChanges = "badgeNeedsChanges",
    Concluded = "concluded",
}

export interface ITournament extends Document {
    name: string;
    description: string;
    startDate: Date;
    endDate: Date;
    forumUrl: string;
    host: IUser;
    staff: IUser[];
    type: TournamentType;
    bannerUrl?: string;
    badges: string[];
    language: string;
    // screeningList: figure it out
    assignedReviewers: IUser[];
    reviews: IVote[];
    status: TournamentStatus;
    notes: INote[];

    // virtuals
    isTournament: boolean;
    isContest: boolean;
    isOngoing: boolean;
    isUpcoming: boolean;
    isConcluded: boolean;
}
