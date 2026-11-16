import { Document } from "mongoose";
import { ISoftDeletable } from "./SoftDelete";

export interface ITemplate extends Document, ISoftDeletable {
    name: string;
    content: string;
    category: string;
    createdAt: Date;
    updatedAt: Date;
}
