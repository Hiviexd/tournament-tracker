import axios from "axios";
import helpers from "../helpers";
import { IUser } from "../../interfaces/User";

export const getLoggedInUser = async () => {
    const response = await axios.get("/api/users/me");
    return helpers.httpIsValid(response.data) ? response.data : null;
};

export const searchUsers = async (search: string, limit?: number): Promise<IUser[]> => {
    if (!search) return [];
    const response = await axios.get("/api/users", {
        params: { userInput: search, limit },
    });
    return response.data;
};

export const getCommitteeUsers = async (): Promise<IUser[]> => {
    const response = await axios.get("/api/users/getCommittee");
    return response.data;
};

export const getUserById = async (id: string) => {
    const response = await axios.get(`/api/users/${id}`);
    return response.data;
};

export const createUser = async (id: string) => {
    const response = await axios.post("/api/users/create", { userInput: id });
    return response.data;
};
