import { Document } from "mongoose";
import { IUser } from "./User";
import { IAttachment } from "./Attachment";
import { IReview } from "./Review";

export type TournamentType = "tournament" | "contest";

export type GameMode = "osu" | "taiko" | "catch" | "mania";

export type TournamentStatus =
    | "supportRequestReceived"
    | "screeningOngoing"
    | "screeningConcluded"
    | "reviewOngoing"
    | "changesRequested"
    | "badgeApproved"
    | "badgeRejected"
    | "noBadgeRequested";

export interface TournamentQueryParams {
    name?: string | RegExp;
    modes?: { $in: GameMode[] };
    host?: IUser;
    type?: TournamentType;
    status?: TournamentStatus;
    isActive?: boolean;
    showNeedsAttention?: boolean;
    page?: number;

    // backend only
    $and?: any[]; // For complex MongoDB queries
}

export interface ITournamentFormData extends FormData {
    files?: File[];
}

export type TournamentFormData = Partial<ITournament> & ITournamentFormData;

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
    banner?: IAttachment;
    badges?: IAttachment[];
    assignedReviewers?: IUser[];
    reviews: IReview[];
    createdAt: Date;

    // virtuals
    isTournament: boolean;
    isContest: boolean;
    statusString: string;
    bannerUrl: string;
}
