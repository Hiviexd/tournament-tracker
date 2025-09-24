import { IOsuCountry } from "./OsuApi";
import { Model, Types } from "mongoose";

export type UserGroup = "user" | "tc" | "cc" | "admin" | "alm" | "dev";

export type BadgedUserGroup = Exclude<UserGroup, "user" | "admin" | "dev">;

export interface IUserHistory {
    date: Date;
    group: UserGroup;
    kind: "join" | "leave";
}

export interface UserListQuery {
    userInput?: string;
    limit?: string;
}

export interface UpdateUserGroupsRequest {
    userId: string;
    group: string;
    join: boolean;
}

export interface UpdateBadgeRequest {
    userId: string;
    increment: boolean;
}

export interface IUser {
    _id: Types.ObjectId;
    id: string;
    osuId: number;
    username: string;
    groups: UserGroup[];
    history: IUserHistory[];
    discordId?: string;
    isActiveReviewer: boolean;
    inBag: boolean;
    coverUrl?: string;
    country?: IOsuCountry;
    badgeValue: number;
    email?: string;
    createdAt: Date;
    updatedAt: Date;

    // virtuals
    avatarUrl: string;
    osuProfileUrl: string;
    isTournamentCommittee: boolean;
    isContestCommittee: boolean;
    isAdmin: boolean;
    isDev: boolean;
    isAlumni: boolean;
    isCommittee: boolean;
    isCommitteeOrAdmin: boolean;
    tcDuration: number;
    ccDuration: number;
}

export interface IUserStatics extends Model<IUser> {
    findByUsernameOrOsuId: (user: string | number) => Promise<IUser | null>;
}
