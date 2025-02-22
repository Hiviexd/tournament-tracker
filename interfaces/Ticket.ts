import { Document } from "mongoose";
import { UserGroup, IUser } from "./User";
import { ITournament } from "./Tournament";
import { IMessage } from "./Message";

export type TicketType = "ticket" | "report";

export interface TicketQueryParams {
    type?: TicketType;
    title?: string;
    targetUser?: string;
    targetTournament?: string;
    assignedGroup?: string;
    isActive?: boolean;
    showOwn?: boolean;
    page?: number;
}

export interface ITicketFormData extends FormData {
    files?: File[];
}

export type TicketFormData = Partial<ITicket> & ITicketFormData;

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
    isTicket: boolean;
}
