import { Document } from "mongoose";
import { UserGroup, IUser } from "./User";
import { ITournament } from "./Tournament";
import { IMessage } from "./Message";

export type TicketType = "ticket" | "report";

export interface TicketQueryParams {
    type?: TicketType;
    title?: string;
    assignedGroup?: string;
    isActive?: boolean;
    showOwn?: boolean;
    page?: number;
}

export interface ITicket extends Document {
    author: IUser;
    type: TicketType;
    assignedGroup: UserGroup;
    title: string;
    messages: IMessage[];
    isActive: boolean;
    targetUser?: IUser;
    targetTournament?: ITournament;
    createdAt: Date;
    updatedAt: Date;

    // temporary until tournaments model is used
    targetTournamentName?: string;
    targetTournamentLink?: string;

    // virtuals
    isReport: boolean;
}
