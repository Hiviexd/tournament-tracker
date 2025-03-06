import axios from "axios";

export interface UpdateSessionBody {
    mongoId: string;
    osuId: string;
    username: string;
}

export const getSession = async () => {
    const response = await axios.get("/api/dev/session");
    return response.data;
};

export const updateSession = async (body: UpdateSessionBody) => {
    const response = await axios.post("/api/dev/session/update", body);
    return response.data;
};
