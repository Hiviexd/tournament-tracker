import { IOsuCountry } from './OsuApi';
import { Document, Model, DocumentQuery } from 'mongoose';

export enum UserGroup {
    User = "user",
    Tournaments = "tc",
    Contests = "cc",
    Admin = "admin",
}

export enum GameMode {
    Osu = "osu",
    Taiko = "taiko",
    Catch = "catch",
    Mania = "mania",
}

export interface IUserHistory {
    date: Date;
    mode: GameMode;
    group: UserGroup;
    kind: "join" | "leave";
}

export interface IUser extends Document {
    osuId: number;
    username: string;
    groups: UserGroup[];
    history: IUserHistory[];
    discordId?: string;
    active: boolean;
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
