import { Document } from "mongoose";
import { IUser } from "./User";

export type VoteType = VariableVote | BinaryVote | ClassicVote | RankedChoiceVote | BinaryStrictVote;

// ? Initial commit

export interface VariableVoteScore {
    optionIndex: number;
    score: number; // from -5 to 5
}

export interface VariableVote {
    type: "variable";
    scores: VariableVoteScore[]; // array of scores for each option
}

export interface BinaryVote {
    type: "binary";
    score: number; // between -5 and 5
}

export interface ClassicVote {
    type: "classic";
    option: number; // index of the selected option
}

// ? 2025-05-25: Added ranked choice and strict binary vote types

export interface RankedChoiceVote {
    type: "ranked-choice";
    scores: RankedChoiceVoteScore[]; // array of scores for each option
}

export interface RankedChoiceVoteScore {
    optionIndex: number;
    score: number; // from 0 to 5
}

export interface BinaryStrictVote {
    type: "binary-strict";
    score: number; // from -1 to 1
}

export interface IVote extends Document {
    author: IUser;
    comment?: string;
    data: VoteType;
    createdAt: Date;
}
