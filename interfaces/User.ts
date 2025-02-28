import { IOsuCountry } from "./OsuApi";
import { Document, Model, DocumentQuery } from "mongoose";

export type UserGroup = "user" | "tc" | "cc" | "admin" | "alm";

export type BadgedUserGroup = Exclude<UserGroup, "user" | "admin">;

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

export interface IUser extends Document {
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

    // virtuals
    avatarUrl: string;
    osuProfileUrl: string;
    isTournamentCommittee: boolean;
    isContestCommittee: boolean;
    isAdmin: boolean;
    isAlumni: boolean;
    isCommittee: boolean;
    tcDuration: number;
    ccDuration: number;
}

export interface IUserStatics extends Model<IUser> {
    findByUsernameOrOsuId: (user: string | number) => DocumentQuery<IUser, IUser>;
}
