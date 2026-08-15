import { Document } from "mongoose";
import { IUser } from "./User";

export const REVIEW_VOTE_TYPES = ["approve", "changesRequested", "deny"] as const;
export type ReviewVoteType = (typeof REVIEW_VOTE_TYPES)[number];

export interface IReviewChecklistItem {
    item: string;
    checked: boolean;
}

export interface IReview extends Document {
    author?: IUser;
    comment: string;
    vote: ReviewVoteType;
    checklist: IReviewChecklistItem[];
    createdAt?: Date;
    updatedAt?: Date;
}
