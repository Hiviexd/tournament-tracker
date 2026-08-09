import { Document, Types } from "mongoose";
import { IUser } from "./User";

export type ResourceCategory = "discord" | "tool" | "guide" | "spreadsheet" | "article";

export type ResourceType = "official" | "community";

export interface ResourceQueryParams {
    search?: string;
    author?: string;
    category?: ResourceCategory;
    type?: ResourceType;
    page?: number;
}

export interface IResourceFormData {
    title: string;
    description: string;
    category: ResourceCategory;
    type: ResourceType;
    link: string;
}

export type ResourceFormData = Partial<IResource> & FormData;

export interface IResource extends Document {
    _id: Types.ObjectId;
    id: string;
    title: string;
    description: string;
    author?: IUser;
    category: ResourceCategory;
    type: ResourceType;
    link: string;
    createdAt: Date;
    updatedAt: Date;
}
