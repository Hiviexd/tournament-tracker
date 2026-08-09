import { Types } from "mongoose";
import { IUser } from "./User";
import { IAttachment } from "./Attachment";

export interface IMessageFormData extends FormData {
    content: string;
    isCommittee: boolean;
    isNote?: boolean;
    attachments?: File[];
}

export interface IMessage {
    _id: Types.ObjectId;
    id: string;
    author: IUser;
    content: string;
    isCommittee: boolean;
    isNote?: boolean;
    attachments?: IAttachment[];
    event?: "close" | "reopen";
    createdAt: Date;
}
