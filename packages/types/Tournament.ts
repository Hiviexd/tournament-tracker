import { Types } from "mongoose";
import { IUser } from "./User";
import { IAttachment } from "./Attachment";
import { IReview } from "./Review";
import { IMessage } from "./Message";

export const TOURNAMENT_TYPES = ["tournament", "contest"] as const;
export type TournamentType = (typeof TOURNAMENT_TYPES)[number];

export const GAME_MODES = ["osu", "taiko", "catch", "mania"] as const;
export type GameMode = (typeof GAME_MODES)[number];

export const TOURNAMENT_STATUSES = [
    "supportRequestReceived",
    "screeningConcluded",
    "reviewOngoing",
    "changesRequested",
    "onHold",
    "badgeApproved",
    "badgeRejected",
    "noBadgeRequested",
] as const;
export type TournamentStatus = (typeof TOURNAMENT_STATUSES)[number];

export interface TournamentQueryParams {
    modes?: { $in: GameMode[] };
    hosts?: { $in: Types.ObjectId[] };
    type?: TournamentType;
    status?: TournamentStatus;
    isActive?: boolean;
    showNeedsAttention?: boolean;
    page?: number;

    // backend only
    $and?: any[]; // For complex MongoDB queries
    $or?: any[]; // For search queries
    forumUrl?: string;
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

export const REVIEW_HISTORY_ACTIONS = ["assign", "remove", "initial"] as const;
export type ReviewHistoryAction = (typeof REVIEW_HISTORY_ACTIONS)[number];

export interface ITournamentReviewHistoryEntry {
    user: Types.ObjectId;
    action: ReviewHistoryAction;
    createdAt: Date;
    updatedAt: Date;
}

export interface ITournamentCreateResponse {
    message: string;
    tournament: ITournament;
}

export const EXTRA_LINK_TYPES = [
    "news",
    "wiki",
    "challonge",
    "sheet",
    "website",
    "mappersguild",
    "contest",
    "discord",
    "twitch",
] as const;
export type ExtraLinkType = (typeof EXTRA_LINK_TYPES)[number];

export interface ITournamentExtraLink {
    type: ExtraLinkType;
    name: string;
    url: string;
}

export interface ITournament {
    _id: Types.ObjectId;
    id: string;
    name: string;
    modes: GameMode[];
    startDate: Date | null;
    endDate: Date | null;
    forumUrl: string;
    threadId?: string;
    hosts: IUser[];
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
    tags?: string[];
    reviewHistory?: ITournamentReviewHistoryEntry[];
    extraLinks?: ITournamentExtraLink[];

    // virtuals
    isTournament: boolean;
    isContest: boolean;
    statusString: string;
    bannerUrl: string;
}
