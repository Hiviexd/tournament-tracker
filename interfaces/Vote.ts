import { Document } from "mongoose";
import { IUser } from "./User";

export interface IVote extends Document {
    author: IUser;
    comment: string;
    vote: number;
}
