import { Document } from "mongoose";
import { IUser } from "./User";

type ApiScopeCategory = "tournaments" | "votings" | "resources" | "users" | "tickets" | "compliance";
type ApiScopeAction = "read" | "write";

export type ApiScope = `${ApiScopeCategory}:${ApiScopeAction}`;

export enum AllApiScopes {
    BEATMAPS_READ = "beatmaps:read", // ! Removed 2025-09-14
    COMPLIANCE_READ = "compliance:read", // ! Added 2025-09-14
    TOURNAMENTS_READ = "tournaments:read",
    VOTINGS_READ = "votings:read",
    RESOURCES_READ = "resources:read",
    USERS_READ = "users:read",
    TICKETS_READ = "tickets:read",
}

export enum AvailableApiScopes {
    COMPLIANCE_READ = "compliance:read",
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
