import axios from "axios";
import { IQuote } from "../../interfaces/Quote";

export const getRandomQuote = async (): Promise<IQuote> => {
    const response = await axios.get("/api/quotes");
    return response.data;
};

export const getAllQuotes = async (): Promise<IQuote[]> => {
    const response = await axios.get("/api/quotes/all");
    return response.data;
};

export const createQuote = async (authorId: string, quote: string, creationDate?: Date) => {
    const response = await axios.post("/api/quotes/create", { authorId, quote, creationDate });
    return response.data;
};
