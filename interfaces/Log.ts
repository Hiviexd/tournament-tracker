import { IUser } from "./User";
import { Document } from "mongoose";

export type LogCategory = "account" | "user" | "tournament" | "report" | "voting";

export interface ILog extends Document {
    user: IUser;
    action: string;
    category: LogCategory;
}
