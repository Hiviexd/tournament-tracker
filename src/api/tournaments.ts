import axios from "axios";
import { ITournament } from "../../interfaces/Tournament";

export interface TournamentQueryParams {
    name?: string;
    mode?: string;
    host?: string;
    type?: string;
    status?: string;
    active?: string;
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

export const createTournament = async (tournamentData: Partial<ITournament>) => {
    const response = await axios.post("/api/tournaments/create", tournamentData);
    return response.data;
};
