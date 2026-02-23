import { Model, Types } from "mongoose";

export enum InfringementType {
    NOTE = "note",
    WARNING = "warning",
    TOURNAMENT_BAN = "tournament_ban",
    HOSTING_BAN = "hosting_ban",
    STAFFING_BAN = "staffing_ban",
}

export const TIME_BASED_TYPES: InfringementType[] = [
    InfringementType.TOURNAMENT_BAN,
    InfringementType.HOSTING_BAN,
    InfringementType.STAFFING_BAN,
];

export interface IInfringement {
    _id?: Types.ObjectId;
    id?: string;
    userId: Types.ObjectId;
    type: InfringementType;
    startDate?: Date;
    endDate?: Date;
    reason: string;
    threadId?: string;
    enchantUrl?: string;
    createdAt?: Date;
    updatedAt?: Date;

    // virtuals
    isTimeBased?: boolean;
    isIndefinite?: boolean;
    typeString?: string;
    isExpired?: boolean;
}

export interface WatchlistQuery {
    userInput?: string;
    infringementType?: InfringementType;
}

export interface IInfringementStatics extends Model<IInfringement> {
    findActiveForUser: (userId: string | Types.ObjectId) => Promise<IInfringement | null>;
}
