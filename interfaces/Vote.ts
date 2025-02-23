import { Document } from "mongoose";
import { IUser } from "./User";

export interface VariableVoteScore {
    optionIndex: number;
    score: number;
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

export type VoteType = VariableVote | BinaryVote | ClassicVote;

export interface IVote extends Document {
    author: IUser;
    comment?: string;
    data: VoteType;
    createdAt: Date;
}
