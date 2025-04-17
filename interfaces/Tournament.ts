import { Document } from "mongoose";
import { IUser } from "./User";
import { IAttachment } from "./Attachment";
import { IReview } from "./Review";
import { IMessage } from "./Message";

export type TournamentType = "tournament" | "contest";

export type GameMode = "osu" | "taiko" | "catch" | "mania";

export type TournamentStatus =
    | "supportRequestReceived"
    | "screeningConcluded"
    | "reviewOngoing"
    | "changesRequested"
    | "onHold"
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

export interface ITournamentLog {
    user: IUser;
    action: string;
    icon?: string;
    createdAt: Date;
}

export interface ITournament extends Document {
    name: string;
    modes: GameMode[];
    startDate: Date | null;
    endDate: Date | null;
    forumUrl: string;
    threadId?: string;
    host: IUser;
    type: TournamentType;
    status: TournamentStatus;
    isActive: boolean;
    banner?: IAttachment;
    badges?: IAttachment[];
    assignedReviewers?: IUser[];
    reviews: IReview[];
    logs: ITournamentLog[];
    notes: IMessage[];
    winners?: IUser[];
    enchantUrl?: string;
    createdAt: Date;
    startedReviewAt?: Date;

    // virtuals
    isTournament: boolean;
    isContest: boolean;
    statusString: string;
    bannerUrl: string;
}
