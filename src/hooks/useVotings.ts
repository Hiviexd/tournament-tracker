import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    getVotings,
    getVoting,
    createVoting,
    submitVote,
    toggleVotingStatus,
    updateVoting,
    deleteVoting,
    deleteVote,
} from "../api/votings";
import { handleMutationResponse } from "../api/helpers";
import { IVoting, VotingQueryParams } from "../../interfaces/Voting";

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
        mutationFn: async (votingData: Partial<IVoting>) => {
            const response = await createVoting(votingData);
            return handleMutationResponse(response, "Voting created successfully");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["votings"] });
        },
    });
}

export function useSubmitVote(votingId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (voteData: { option: number; comment?: string }) => {
            const response = await submitVote(votingId, voteData);
            return handleMutationResponse(response, "Vote submitted successfully");
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
            return handleMutationResponse(response, `Voting status updated successfully`);
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
            return handleMutationResponse(response, "Voting updated successfully");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["voting", votingId] });
        },
    });
}

export function useDeleteVoting() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (votingId: string) => {
            const response = await deleteVoting(votingId);
            return handleMutationResponse(response, "Voting deleted successfully");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["votings"] });
        },
    });
}

export function useDeleteVote(votingId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (voteId: string) => {
            const response = await deleteVote(votingId, voteId);
            return handleMutationResponse(response, "Vote deleted successfully");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["voting", votingId] });
        },
    });
}
