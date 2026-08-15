import { Document, Types } from "mongoose";
import { IUser } from "./User";

export const RESOURCE_CATEGORIES = ["discord", "tool", "guide", "spreadsheet", "article"] as const;
export type ResourceCategory = (typeof RESOURCE_CATEGORIES)[number];

export const RESOURCE_TYPES = ["official", "community"] as const;
export type ResourceType = (typeof RESOURCE_TYPES)[number];

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
