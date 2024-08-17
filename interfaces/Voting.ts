import { Document } from "mongoose";

export enum VotingCategory {
    // Tournament and User need to be uppercase to match the collection names. scuffed, I know.
    Tournament = "Tournament",
    User = "User",
    Discussion = "discussion",
}

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
