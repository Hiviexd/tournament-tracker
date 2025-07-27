import { Document } from "mongoose";

export interface ITemplate extends Document {
    name: string;
    content: string;
    category: string;
    createdAt: Date;
    updatedAt: Date;
}
