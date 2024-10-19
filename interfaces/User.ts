import { IOsuCountry } from './OsuApi';
import { Document, Model, DocumentQuery } from 'mongoose';

export type UserGroup = "user" | "tc" | "cc" | "admin";

export interface IUserHistory {
    date: Date;
    group: UserGroup;
    kind: "join" | "leave";
}

export interface IUser extends Document {
    osuId: number;
    username: string;
    groups: UserGroup[];
    history: IUserHistory[];
    discordId?: string;
    isActive: boolean;
    inBag: boolean;
    coverUrl?: string;
    country?: IOsuCountry;

    // virtuals
    avatarUrl: string;
    isTournamentCommittee: boolean;
    isContestCommittee: boolean;
    isAdmin: boolean;
    isCommittee: boolean;
    tcDuration: number;
    ccDuration: number;
    isDev: boolean;
}

export interface IUserStatics extends Model<IUser> {
    findByUsernameOrOsuId: (user: string | number) => DocumentQuery<IUser, IUser>;
}
