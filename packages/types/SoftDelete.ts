import { Types } from "mongoose";

export interface ISoftDeletable {
    deletedAt?: Date | null;
    deletedBy?: Types.ObjectId | string | null;
}
