import { Document } from "mongoose";
import { IUser } from "./User";

export interface IMessage extends Document {
    author: IUser;
    content: string;
    isCommittee: boolean;
    isNote?: boolean;
}
