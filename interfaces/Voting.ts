import { Document } from "mongoose";
import { UserGroup, IUser } from "./User";
import { IVote } from "./Vote";
import { IAttachment } from "./Attachment";

export type VotingCategory = "tournament" | "user" | "discussion";

/**
 * Voting types:
 * * **variable**: multiple options, vote on each option, giving it a score from -5 to 5
 * * **binary**: two options, set a score between -5 and 5 to express how close you are to each option
 * * **classic**: multiple options, select one option
 */
export type VotingType = "variable" | "binary" | "classic";

export interface VotingQueryParams {
    isPublic?: boolean;
    title?: string | RegExp;
    category?: VotingCategory;
    assignedGroup?: UserGroup;
    status?: string;
    showNeedsAttention?: boolean;
    page?: number;

    // backend only
    assignedGroups?: { $in: UserGroup[] };
    isActive?: boolean;
    $and?: any[]; // For complex MongoDB queries
}

export interface VotingListQuery {
    title?: string;
    category?: VotingCategory;
    assignedGroup?: UserGroup;
    status?: string;
    showNeedsAttention?: string;
    page?: number;
}

export interface IVotingFormData extends FormData {
    files?: File[];
}

export type VotingFormData = Partial<IVoting> & IVotingFormData;

export interface IVoting extends Document {
    author: IUser;
    category: VotingCategory;
    assignedGroups: UserGroup[];
    title: string;
    description: string;
    isActive: boolean;
    duration: number;
    type: VotingType;
    options: string[];
    votes: IVote[];
    targetUser?: IUser;
    targetTournamentName?: string;
    targetTournamentLink?: string;
    requiredVotes: number;
    attachments: IAttachment[];
    createdAt: Date;
    updatedAt: Date;
    isPublic: boolean;

    // virtuals
    deadline: Date;
    isOverdue: boolean;
    isTournamentVote: boolean;
    isUserVote: boolean;
    isDiscussionVote: boolean;
    isTournamentCommitteeVote: boolean;
    isContestCommitteeVote: boolean;
}
