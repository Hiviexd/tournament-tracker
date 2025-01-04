import axios from "axios";
import { LogQueryParams } from "../../interfaces/Log";

export const getLogs = async (params?: LogQueryParams) => {
    const response = await axios.get("/api/logs", { params });
    return response.data;
};
