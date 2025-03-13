import axios from "axios";
import helpers from "../helpers";
import { IUser, UpdateUserGroupsRequest, UpdateBadgeRequest } from "../../interfaces/User";

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

export const getCommitteeUsers = async (includeAlumni?: boolean): Promise<IUser[]> => {
    const response = await axios.get("/api/users/getCommittee", {
        params: { includeAlumni },
    });
    return response.data;
};

export const getUserById = async (id: string) => {
    const response = await axios.get(`/api/users/${id}`);
    return response.data;
};

export const getOsuUserInfo = async (userInput: string) => {
    const response = await axios.get(`/api/users/${userInput}/osu`);
    return response.data;
};

export const createUser = async (id: string) => {
    const response = await axios.post("/api/users/create", { userInput: id });
    return response.data;
};

export const toggleReviewerStatus = async (userId: string) => {
    const response = await axios.post(`/api/users/${userId}/toggleReviewerStatus`);
    return response.data;
};

export const updateUserGroup = async (data: UpdateUserGroupsRequest) => {
    const response = await axios.post(`/api/users/${data.userId}/groupMove`, {
        group: data.group,
        join: data.join,
    });
    return response.data;
};

export const updateUserBadge = async (data: UpdateBadgeRequest) => {
    const response = await axios.post(`/api/users/${data.userId}/updateBadge`, {
        increment: data.increment,
    });
    return response.data;
};

export const syncUser = async (userId: string) => {
    const response = await axios.post(`/api/users/${userId}/sync`);
    return response.data;
};

export const updateDiscordId = async (userId: string, discordId: string) => {
    const response = await axios.post(`/api/users/${userId}/updateDiscordId`, { discordId });
    return response.data;
};
