import axios from "axios";
import helpers from "../helpers";
import { IUser } from "../../interfaces/User";

export const getLoggedInUser = async () => {
    const response = await axios.get("/api/users/me");
    return helpers.httpIsValid(response.data) ? response.data : null;
};

export const searchUsers = async (search: string, limit?: number): Promise<IUser[]> => {
    if (!search) return [];
    const params = { userInput: search, limit };
    const response = await axios.get("/api/users", { params });
    return response.data;
};
