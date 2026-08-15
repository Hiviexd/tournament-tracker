import { IOsuCountry } from "./OsuApi";
import { Model, Types } from "mongoose";
import { IInfringement } from "./Infringement";

export const USER_GROUPS = ["user", "tc", "cc", "admin", "alm", "dev"] as const;
export type UserGroup = (typeof USER_GROUPS)[number];

export const BADGED_USER_GROUPS = ["tc", "cc", "alm"] as const;
export type BadgedUserGroup = (typeof BADGED_USER_GROUPS)[number];

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
    isActiveVoter: boolean;
    inBag: boolean;
    coverUrl?: string;
    country?: IOsuCountry;
    badgeValue: number;
    email?: string;
    infringements: IInfringement[];
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
    latestAction?: IInfringement;
    activeInfringement?: IInfringement;
}

export interface IUserStatics extends Model<IUser> {
    findByUsernameOrOsuId: (user: string | number) => Promise<IUser | null>;
}
