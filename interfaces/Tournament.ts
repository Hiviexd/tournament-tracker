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

export interface TournamentQueryParams {
    name?: string | RegExp;
    modes?: { $in: GameMode[] };
    host?: IUser;
    type?: TournamentType;
    status?: TournamentStatus;
    isActive?: boolean;
    page?: number;
}
export interface ITournament extends Document {
    name: string;
    modes: GameMode[];
    startDate: Date | null;
    endDate: Date | null;
    forumUrl: string;
    host: IUser;
    type: TournamentType;
    status: TournamentStatus;
    isActive: boolean;
    bannerUrl?: string;
    badges?: string[];
    assignedReviewers?: IUser[];
    reviews?: IVote[];
    createdAt: Date;

    // virtuals
    isTournament: boolean;
    isContest: boolean;
}
