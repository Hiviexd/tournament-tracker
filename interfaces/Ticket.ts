import { Types } from "mongoose";
import { UserGroup, IUser } from "./User";
import { IMessage } from "./Message";

export type TicketType = "ticket" | "report";

export interface TicketQueryParams {
    type?: TicketType;
    title?: string;
    content?: string;
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

export interface ITicketCreateResponse {
    message: string;
    ticket: ITicket;
}

export interface ITicket {
    _id: Types.ObjectId;
    id: string;
    author: IUser;
    type: TicketType;
    assignedGroup: UserGroup;
    title: string;
    messages: IMessage[];
    isActive: boolean;
    targetUser?: IUser;
    targetTournamentName?: string;
    targetTournamentLink?: string;
    threadId?: string;
    createdAt: Date;
    updatedAt: Date;
    snoozedUntil?: Date;

    // virtuals
    isReport: boolean;
    isTicket: boolean;
    lastResponseAt: Date;
    isSnoozed: boolean;
}
