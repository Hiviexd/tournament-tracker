import axios from "axios";
import { ArticleType } from "@interfaces/Article";

export const getArticle = async (slug: string) => {
    // Try public endpoint first
    const publicResponse = await axios.get(`/api/articles/${slug}/public`);

    if (publicResponse.data.error) {
        const privateResponse = await axios.get(`/api/articles/${slug}/private`);
        return privateResponse.data;
    }
    return publicResponse.data;
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
