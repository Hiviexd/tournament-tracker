import axios from "axios";
import { type VoteType } from "../../interfaces/Vote";
import { IVoting, VotingQueryParams, type VotingFormData } from "../../interfaces/Voting";

export const getVotings = async (params?: VotingQueryParams) => {
    const response = await axios.get("/api/votings", { params });
    return response.data;
};

export const getVoting = async (votingId: string) => {
    const response = await axios.get(`/api/votings/${votingId}`);
    return response.data;
};

export const createVoting = async (votingData: VotingFormData) => {
    const response = await axios.post("/api/votings/create", votingData);
    return response.data;
};

export const submitVote = async (
    votingId: string,
    voteData: { data: VoteType; comment?: string }
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
