import axios from "axios";
import { ArticleType } from "@interfaces/Article";

export const getArticle = async (slug: string) => {
    const response = await axios.get(`/api/articles/${slug}`);
    return response.data;
};

export const getDocumentation = async () => {
    const response = await axios.get("/api/articles/documentation");
    return response.data;
};

export interface CreateArticleData {
    title: string;
    content: string;
    type: ArticleType;
    isPublic: boolean;
}

export const createArticle = async (data: CreateArticleData) => {
    const response = await axios.post("/api/articles/create", data);
    return response.data;
};

export const editArticle = async (slug: string, content: string) => {
    const response = await axios.post(`/api/articles/${slug}/edit`, { content });
    return response.data;
};

export const deleteArticle = async (slug: string) => {
    const response = await axios.post(`/api/articles/${slug}/delete`);
    return response.data;
};
