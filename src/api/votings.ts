import axios from "axios";

import { IVoting, VotingQueryParams } from "../../interfaces/Voting";

export const getVotings = async (params?: VotingQueryParams) => {
    const response = await axios.get("/api/votings", { params });
    return response.data;
};

export const getVoting = async (votingId: string) => {
    const response = await axios.get(`/api/votings/${votingId}`);
    return response.data;
};

export const createVoting = async (votingData: Partial<IVoting>) => {
    const response = await axios.post("/api/votings/create", votingData);
    return response.data;
};

export const submitVote = async (
    votingId: string,
    voteData: { option: number; comment?: string }
) => {
    const response = await axios.post(`/api/votings/${votingId}/submitVote`, voteData);
    return response.data;
};

export const toggleVotingStatus = async (votingId: string) => {
    const response = await axios.post(`/api/votings/${votingId}/toggleStatus`);
    return response.data;
};

export const updateVoting = async (votingId: string, votingData: Partial<IVoting>) => {
    const response = await axios.post(`/api/votings/${votingId}/update`, votingData);
    return response.data;
};

export const deleteVoting = async (votingId: string) => {
    const response = await axios.post(`/api/votings/${votingId}/delete`);
    return response.data;
};

export const deleteVote = async (votingId: string, voteId: string) => {
    const response = await axios.post(`/api/votings/${votingId}/deleteVote/${voteId}`);
    return response.data;
};
