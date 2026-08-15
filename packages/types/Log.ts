import { IUser } from "./User";
import { Document } from "mongoose";

export const LOG_CATEGORIES = [
    "account",
    "user",
    "tournament",
    "voting",
    "ticket",
    "article",
    "resource",
    "api_key",
    "settings",
] as const;
export type LogCategory = (typeof LOG_CATEGORIES)[number];

export interface LogQueryParams {
    user?: IUser;
    category?: LogCategory;
    action?: { $regex: string; $options: string };
    isSystemLog?: boolean;
    page?: number;
}

export interface LogListQuery {
    user?: string;
    category?: LogCategory;
    type?: string;
    content?: string;
    page?: number;
}

export interface ILog extends Document {
    user: IUser;
    action: string;
    category: LogCategory;
    isSystemLog: boolean;
    createdAt: Date;

    // virtuals
    categoryString: string;
}
