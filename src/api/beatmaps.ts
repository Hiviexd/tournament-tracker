import axios from "axios";

export const checkMappoolCompliance = async (input: string) => {
    const response = await axios.post("/api/beatmaps/check", { input });
    return response.data;
};
