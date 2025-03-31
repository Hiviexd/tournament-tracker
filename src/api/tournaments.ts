import axios from "axios";
import { TournamentFormData } from "../../interfaces/Tournament";
import { IReview } from "@interfaces/Review";
import { IMessageFormData } from "../../interfaces/Message";

export interface TournamentQueryParams {
    name?: string;
    mode?: string;
    host?: string;
    type?: string;
    status?: string;
    state?: string;
    showNeedsAttention?: boolean;
    page?: number;
}

export const getTournaments = async (params?: TournamentQueryParams) => {
    const response = await axios.get("/api/tournaments", { params });
    return response.data;
};

export const getTournament = async (tournamentId: string) => {
    const response = await axios.get(`/api/tournaments/${tournamentId}`);
    return response.data;
};

export const createTournament = async (tournamentData: TournamentFormData) => {
    const response = await axios.post("/api/tournaments/create", tournamentData);
    return response.data;
};

export const editTournament = async (tournamentId: string, tournamentData: Partial<TournamentFormData>) => {
    const response = await axios.post(`/api/tournaments/${tournamentId}/edit`, tournamentData);
    return response.data;
};

export const assignReviewers = async (tournamentId: string) => {
    const response = await axios.post(`/api/tournaments/${tournamentId}/assignReviewers`);
    return response.data;
};

export const reassignReviewer = async (tournamentId: string, oldReviewerId: string, newReviewerId: string) => {
    const response = await axios.post(`/api/tournaments/${tournamentId}/reassignReviewer`, {
        oldReviewerId,
        newReviewerId,
    });
    return response.data;
};

export const submitReview = async (tournamentId: string, reviewData: Partial<IReview>) => {
    const response = await axios.post(`/api/tournaments/${tournamentId}/submitReview`, reviewData);
    return response.data;
};

export const uploadBadges = async (tournamentId: string, badgeFiles: File[]) => {
    const formData = new FormData();
    badgeFiles.forEach((file) => formData.append("files", file));

    const response = await axios.post(`/api/tournaments/${tournamentId}/uploadBadges`, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
    return response.data;
};

export const downloadBadges = async (tournamentId: string) => {
    const response = await axios.get(`/api/tournaments/${tournamentId}/downloadBadges`, {
        responseType: "blob",
    });

    // Create a download link and trigger it
    const url = window.URL.createObjectURL(response.data);
    const a = document.createElement("a");
    a.href = url;
    const filename = response.headers["content-disposition"]?.split("filename=")[1] || "badges.zip";
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    return response.data;
};

export const updateThreadId = async (tournamentId: string, threadId: string) => {
    const response = await axios.post(`/api/tournaments/${tournamentId}/updateThreadId`, { threadId });
    return response.data;
};

export const createNote = async (tournamentId: string, noteData: IMessageFormData) => {
    const response = await axios.post(`/api/tournaments/${tournamentId}/createNote`, noteData);
    return response.data;
};
