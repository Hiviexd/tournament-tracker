import { ITournament } from './Tournament';
import { IUser } from './User';
import { Document } from "mongoose";

export enum VoteCategory {
    // Tournament and User need to be uppercase to match the collection names. scuffed, I know.
    Tournament = "Tournament",
    User = "User",
    Discussion = "discussion",
}

export interface IVote extends Document {
    category: string;
    title: string;
    description: string;
    duration: number;
    options: string[];
    reporter: IUser;
    consensus: string;
    target?: IUser | ITournament;
    createdAt: Date;

    // virtuals
    deadline: Date;
    isActive: boolean;
    isTournamentVote: boolean;
    isUserVote: boolean;
    isDiscussionVote: boolean;
}
