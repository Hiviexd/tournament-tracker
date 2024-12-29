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
import { IVoting, VotingQueryParams } from "../../interfaces/Voting";
import { notifications } from "@mantine/notifications";

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
        mutationFn: createVoting,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["votings"] });
            notifications.show({
                title: "Success",
                message: "Voting created successfully",
                color: "green",
            });
        },
    });
}

export function useSubmitVote(votingId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (voteData: { option: number; comment: string }) =>
            submitVote(votingId, voteData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["voting", votingId] });
            notifications.show({
                title: "Success",
                message: "Vote submitted successfully",
                color: "green",
            });
        },
    });
}

export function useToggleVotingStatus(votingId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => toggleVotingStatus(votingId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["voting", votingId] });
        },
    });
}

export function useUpdateVoting(votingId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (votingData: Partial<IVoting>) => updateVoting(votingId, votingData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["voting", votingId] });
            notifications.show({
                title: "Success",
                message: "Voting updated successfully",
                color: "green",
            });
        },
    });
}

export function useDeleteVoting() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteVoting,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["votings"] });
            notifications.show({
                title: "Success",
                message: "Voting deleted successfully",
                color: "green",
            });
        },
    });
}

export function useDeleteVote(votingId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (voteId: string) => deleteVote(votingId, voteId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["voting", votingId] });
            notifications.show({
                title: "Success",
                message: "Vote deleted successfully",
                color: "green",
            });
        },
    });
}
