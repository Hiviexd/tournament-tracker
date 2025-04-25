import { Document } from "mongoose";
import { IUser } from "./User";

export type ReviewVoteType = "approve" | "changesRequested" | "deny";

export interface IReviewChecklistItem {
    item: string;
    checked: boolean;
}

export interface IReview extends Document {
    author: IUser;
    comment: string;
    vote: ReviewVoteType;
    checklist: IReviewChecklistItem[];
    createdAt?: Date;
    updatedAt?: Date;
}
