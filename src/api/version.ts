import axios from "axios";

export const getVersion = async () => {
    const response = await axios.get("/api/version");
    return response.data;
};
