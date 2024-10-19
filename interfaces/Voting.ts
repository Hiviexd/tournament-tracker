import { Document } from "mongoose";

export type VotingCategory = "tournament" | "user" | "discussion";

export interface IVoting extends Document {
    category: VotingCategory;
    title: string;
    description: string;
    isActive: boolean;
    duration: number;
    options: string[];
    createdAt: Date;

    // virtuals
    deadline: Date;
    isOverdue: boolean;
    isTournamentVote: boolean;
    isUserVote: boolean;
    isDiscussionVote: boolean;
}
