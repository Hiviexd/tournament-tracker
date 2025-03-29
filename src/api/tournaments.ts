import axios from "axios";
import { TournamentFormData } from "../../interfaces/Tournament";

export interface TournamentQueryParams {
    name?: string;
    mode?: string;
    host?: string;
    type?: string;
    status?: string;
    state?: string;
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
