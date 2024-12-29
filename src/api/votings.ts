import axios from "axios";
import helpers from "../helpers";

import { IVoting, VotingQueryParams } from "../../interfaces/Voting";

export const getVotings = async (params?: VotingQueryParams) => {
    const response = await axios.get("/api/votings", { params });
    return helpers.httpIsValid(response.data) ? response.data : null;
};

export const getVoting = async (votingId: string) => {
    const response = await axios.get(`/api/votings/${votingId}`);
    return helpers.httpIsValid(response.data) ? response.data : null;
};

export const createVoting = async (votingData: Partial<IVoting>) => {
    const response = await axios.post("/api/votings/create", votingData);
    return helpers.httpIsValid(response.data) ? response.data : null;
};

export const submitVote = async (
    votingId: string,
    voteData: { option: number; comment: string }
) => {
    const response = await axios.post(`/api/votings/${votingId}/submitVote`, voteData);
    return helpers.httpIsValid(response.data) ? response.data : null;
};

export const toggleVotingStatus = async (votingId: string) => {
    const response = await axios.post(`/api/votings/${votingId}/toggleStatus`);
    return helpers.httpIsValid(response.data) ? response.data : null;
};

export const updateVoting = async (votingId: string, votingData: Partial<IVoting>) => {
    const response = await axios.post(`/api/votings/${votingId}/update`, votingData);
    return helpers.httpIsValid(response.data) ? response.data : null;
};

export const deleteVoting = async (votingId: string) => {
    const response = await axios.post(`/api/votings/${votingId}/delete`);
    return helpers.httpIsValid(response.data) ? response.data : null;
};

export const deleteVote = async (votingId: string, voteId: string) => {
    const response = await axios.post(`/api/votings/${votingId}/deleteVote/${voteId}`);
    return helpers.httpIsValid(response.data) ? response.data : null;
};
