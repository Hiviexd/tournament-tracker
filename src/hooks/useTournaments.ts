import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    getTournaments,
    getTournament,
    createTournament,
    // assignReviewers,
    TournamentQueryParams,
    assignReviewers,
    editTournament,
    reassignReviewer,
    submitReview,
} from "../api/tournaments";
import { handleMutationResponse } from "../api/helpers";
import { TournamentFormData } from "../../interfaces/Tournament";
import { IReview } from "@interfaces/Review";

export function useTournaments(params?: TournamentQueryParams) {
    return useQuery({
        queryKey: ["tournaments", params],
        queryFn: () => getTournaments(params),
    });
}

export function useTournament(tournamentId: string) {
    return useQuery({
        queryKey: ["tournament", tournamentId],
        queryFn: () => getTournament(tournamentId),
    });
}

export function useCreateTournament() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (tournamentData: TournamentFormData) => {
            const response = await createTournament(tournamentData);
            return handleMutationResponse(response);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tournaments"] });
        },
    });
}

export function useAssignReviewers(tournamentId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const response = await assignReviewers(tournamentId);
            return handleMutationResponse(response);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tournament", tournamentId] });
        },
    });
}

export function useEditTournament(tournamentId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (tournamentData: Partial<TournamentFormData>) => {
            const response = await editTournament(tournamentId, tournamentData);
            return handleMutationResponse(response);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tournament", tournamentId] });
        },
    });
}

export function useReassignReviewer(tournamentId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ oldReviewerId, newReviewerId }: { oldReviewerId: string; newReviewerId: string }) => {
            const response = await reassignReviewer(tournamentId, oldReviewerId, newReviewerId);
            return handleMutationResponse(response);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tournament", tournamentId] });
        },
    });
}

export function useSubmitReview(tournamentId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (reviewData: Partial<IReview>) => {
            const response = await submitReview(tournamentId, reviewData);
            return handleMutationResponse(response);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tournament", tournamentId] });
        },
    });
}
