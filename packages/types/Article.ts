import { Document, Types } from "mongoose";
import { IUser } from "./User";

export const ARTICLE_TYPES = ["documentation", "resource", "news"] as const; // future types: "changelog", "blog"
export type ArticleType = (typeof ARTICLE_TYPES)[number];

export interface IArticle extends Document {
    _id: Types.ObjectId;
    title: string;
    content: string;
    slug: string;
    type: ArticleType;
    isPublic: boolean;
    lastEditor: IUser;
    createdAt: Date;
    updatedAt: Date;
    isDocumentation?: boolean;
    isNews?: boolean;
}
