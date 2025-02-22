import { Document } from "mongoose";
import { IUser } from "./User";

export interface IAttachment extends Document {
    originalName: string;
    url: string;
    size: number;
    type: string;
    category: string;
    categoryObjectId: string;
    uploadedBy: IUser;
    createdAt: Date;
    updatedAt: Date;
}
