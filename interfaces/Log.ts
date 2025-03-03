import { IUser } from "./User";
import { Document } from "mongoose";

export type LogCategory = "account" | "user" | "tournament" | "voting" | "ticket" | "article";

export interface LogQueryParams {
    user?: IUser;
    category?: LogCategory;
    isSystemLog?: boolean;
    page?: number;
}

export interface LogListQuery {
    user?: string;
    category?: LogCategory;
    type?: string;
    page?: number;
}

export interface ILog extends Document {
    user: IUser;
    action: string;
    category: LogCategory;
    isSystemLog: boolean;
    createdAt: Date;
}
