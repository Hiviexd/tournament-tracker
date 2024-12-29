import { Document } from "mongoose";
import { UserGroup, IUser } from "./User";
import { IVote } from "./Vote";
import { ITournament } from "./Tournament";

export type VotingCategory = "tournament" | "user" | "discussion";

export interface VotingQueryParams {
    title?: string | RegExp;
    author?: IUser;
    category?: VotingCategory;
    isActive?: boolean;
    page?: number;
}

export interface IVoting extends Document {
    author: IUser;
    category: VotingCategory;
    assignedGroups: UserGroup[];
    title: string;
    description: string;
    isActive: boolean;
    duration: number;
    options: string[];
    votes: IVote[];
    targetUser?: IUser;
    targetTournament?: ITournament;
    createdAt: Date;

    // virtuals
    deadline: Date;
    isOverdue: boolean;
    isTournamentVote: boolean;
    isUserVote: boolean;
    isDiscussionVote: boolean;
}
