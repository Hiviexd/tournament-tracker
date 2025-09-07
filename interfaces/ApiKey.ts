import { Document } from "mongoose";
import { IUser } from "./User";

type ApiScopeCategory = "tournaments" | "votings" | "resources" | "users" | "tickets" | "beatmaps";
type ApiScopeAction = "read" | "write";

export type ApiScope = `${ApiScopeCategory}:${ApiScopeAction}`;

export interface IApiKey extends Document {
    user: IUser;
    hashedKey: string;
    name: string;
    scopes: ApiScope[];
    createdAt: Date;
    lastUsed?: Date;
    revokedAt?: Date | null;
}
