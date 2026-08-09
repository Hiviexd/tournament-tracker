import { Document } from "mongoose";
import { IUser } from "./User";

export type ArticleType = "documentation" | "resource"; // future types: "news", "changelog", "blog"

export interface IArticle extends Document {
    _id: string;
    title: string;
    content: string;
    slug: string;
    type: ArticleType;
    isPublic: boolean;
    lastEditor: IUser;
    createdAt: Date;
    updatedAt: Date;
}
