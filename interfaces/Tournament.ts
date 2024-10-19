import { Document } from "mongoose";
import { IUser } from "./User";
import { IVote } from "./Vote";

export type TournamentType = "tournament" | "contest";

export type GameMode = "osu" | "taiko" | "catch" | "mania";

export type TournamentStatus =
    | "supportRequestReceived"
    | "screeningConcluded"
    | "reviewOngoing"
    | "changesRequested"
    | "badgeApproved"
    | "badgeRejected";

export interface ITournament extends Document {
    name: string;
    description: string;
    modes: GameMode[];
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
