import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    getVotings,
    getVoting,
    createVoting,
    submitVote,
    toggleVotingStatus,
    updateVoting,
    deleteVoting,
    toggleVotingPublic,
    clearVotes,
} from "../api/votings";
import utils from "../../utils";
import { IVoting, type VotingFormData, VotingQueryParams } from "../../interfaces/Voting";
import { type VoteType } from "../../interfaces/Vote";

export function useVotings(params?: VotingQueryParams) {
    return useQuery({
        queryKey: ["votings", params],
        queryFn: () => getVotings(params),
    });
}

export function useVoting(votingId: string) {
    return useQuery({
        queryKey: ["voting", votingId],
        queryFn: () => getVoting(votingId),
    });
}

export function useCreateVoting() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (votingData: VotingFormData) => {
            const response = await createVoting(votingData);
            return utils.handleMutationResponse(response);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["votings"] });
        },
    });
}

export function useSubmitVote(votingId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (voteData: { data: VoteType; comment?: string }) => {
            const response = await submitVote(votingId, voteData);
            return utils.handleMutationResponse(response);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["voting", votingId] });
        },
    });
}

export function useToggleVotingStatus(votingId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const response = await toggleVotingStatus(votingId);
            return utils.handleMutationResponse(response);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["voting", votingId] });
        },
    });
}

export function useUpdateVoting(votingId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (votingData: Partial<IVoting>) => {
            const response = await updateVoting(votingId, votingData);
            return utils.handleMutationResponse(response);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["voting", votingId] });
            queryClient.invalidateQueries({ queryKey: ["votings"] });
        },
    });
}

export function useDeleteVoting(votingId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const response = await deleteVoting(votingId);
            return utils.handleMutationResponse(response);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["votings"] });
        },
    });
}

export function useToggleVotingPublic(votingId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const response = await toggleVotingPublic(votingId);
            return utils.handleMutationResponse(response);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["voting", votingId] });
            queryClient.invalidateQueries({ queryKey: ["votings"] });
        },
    });
}

export function useClearVotes(votingId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const response = await clearVotes(votingId);
            return utils.handleMutationResponse(response);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["voting", votingId] });
            queryClient.invalidateQueries({ queryKey: ["votings"] });
        },
    });
}
