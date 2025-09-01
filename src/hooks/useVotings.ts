import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import utils from "../../utils";
import { IVoting, IVotingCreateResponse, type VotingFormData, VotingQueryParams } from "../../interfaces/Voting";
import { type VoteType } from "../../interfaces/Vote";

export function useVotings(params?: VotingQueryParams) {
    return useQuery({
        queryKey: ["votings", params],
        queryFn: () =>
            utils.apiCall<{
                votings: IVoting[];
                total: number;
                page: number;
                pages: number;
            }>({
                method: "get",
                url: "/api/votes",
                params,
            }),
    });
}

export function useVoting(votingId: string) {
    return useQuery({
        queryKey: ["voting", votingId],
        queryFn: () =>
            utils.apiCall<IVoting>({
                method: "get",
                url: `/api/votes/${votingId}`,
            }),
    });
}

export function useCreateVoting() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (votingData: VotingFormData) => {
            const response = await utils.apiCall<IVotingCreateResponse>({
                method: "post",
                url: "/api/votes/create",
                data: votingData,
            });
            return utils.handleMutationResponse<IVotingCreateResponse>(response);
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
            const response = await utils.apiCall({
                method: "post",
                url: `/api/votes/${votingId}/submitVote`,
                data: voteData,
            });
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
            const response = await utils.apiCall({
                method: "patch",
                url: `/api/votes/${votingId}/toggleStatus`,
            });
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
            const response = await utils.apiCall({
                method: "put",
                url: `/api/votes/${votingId}/update`,
                data: votingData,
            });
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
            const response = await utils.apiCall({
                method: "delete",
                url: `/api/votes/${votingId}/delete`,
            });
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
            const response = await utils.apiCall({
                method: "patch",
                url: `/api/votes/${votingId}/togglePublic`,
            });
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
            const response = await utils.apiCall({
                method: "delete",
                url: `/api/votes/${votingId}/clearVotes`,
            });
            return utils.handleMutationResponse(response);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["voting", votingId] });
            queryClient.invalidateQueries({ queryKey: ["votings"] });
        },
    });
}

export function useToggleAbstention(votingId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const response = await utils.apiCall({
                method: "patch",
                url: `/api/votes/${votingId}/toggleAbstention`,
            });
            return utils.handleMutationResponse(response);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["voting", votingId] });
        },
    });
}