import { Document } from "mongoose";
import { IUser } from "./User";

type ApiScopeCategory = "tournaments" | "votings" | "resources" | "users" | "tickets" | "beatmaps";
type ApiScopeAction = "read" | "write";

export type ApiScope = `${ApiScopeCategory}:${ApiScopeAction}`;

export enum AvailableApiScopes {
    BEATMAPS_READ = "beatmaps:read",
    TOURNAMENTS_READ = "tournaments:read",
    VOTINGS_READ = "votings:read",
    RESOURCES_READ = "resources:read",
    USERS_READ = "users:read",
    TICKETS_READ = "tickets:read",
}

export interface IApiKey extends Document {
    user: IUser;
    hashedKey: string;
    name: string;
    scopes: ApiScope[];
    createdAt: Date;
    lastUsedAt?: Date;
    timesUsed: number;
    lastRouteUsed: string;
    revokedAt?: Date | null;
    isElevated: boolean;
}
