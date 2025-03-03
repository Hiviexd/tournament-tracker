import { Document } from "mongoose";

export type ArticleType = "documentation" | "resource"; // future types: "news", "changelog", "blog"

export interface IArticle extends Document {
    _id: string;
    title: string;
    content: string;
    slug: string;
    type: ArticleType;
    isPublic: boolean;
    createdAt: Date;
    updatedAt: Date;
}
