import { Document } from "mongoose";
import { IUser } from "./User";
import { IAttachment } from "./Attachment";

export interface IMessageFormData extends FormData {
    content: string;
    isCommittee: boolean;
    isNote?: boolean;
    attachments?: File[];
}

export interface IMessage extends Document {
    author: IUser;
    content: string;
    isCommittee: boolean;
    isNote?: boolean;
    attachments?: IAttachment[];
    createdAt: Date;
    updatedAt: Date;
}
