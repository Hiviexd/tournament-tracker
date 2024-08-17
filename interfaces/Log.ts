import { IUser } from "./User";
import { Document } from "mongoose";

export enum LogCategory {
    Account = "account",
    User = "user",
    Tournament = "tournament",
    Report = "report",
    Voting = "voting",
}

export interface ILog extends Document {
    user: IUser;
    action: string;
    category: LogCategory;
}
