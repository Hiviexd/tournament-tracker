import { Types } from "mongoose";
import { IUser } from "./User";

export interface IAttachment {
    _id: Types.ObjectId;
    id: string;
    originalName: string;
    url: string;
    size: number;
    type: string;
    category: string;
    categoryObjectId: Types.ObjectId;
    uploadedBy: IUser;
    createdAt: Date;
    updatedAt: Date;
}
