import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    getTournaments,
    getTournament,
    createTournament,
    TournamentQueryParams,
    assignReviewers,
    editTournament,
    reassignReviewer,
    submitReview,
    uploadBadges,
    downloadBadges,
    updateThreadId,
    createNote,
    deleteTournament,
} from "../api/tournaments";
import utils from "../../utils";
import { TournamentFormData } from "../../interfaces/Tournament";
import { IReview } from "../../interfaces/Review";
import { IMessageFormData } from "../../interfaces/Message";

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
            return utils.handleMutationResponse(response);
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
            return utils.handleMutationResponse(response);
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
            return utils.handleMutationResponse(response);
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
            return utils.handleMutationResponse(response);
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
            return utils.handleMutationResponse(response);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tournament", tournamentId] });
        },
    });
}

export function useUploadBadges(tournamentId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (badgeFiles: File[]) => {
            const response = await uploadBadges(tournamentId, badgeFiles);
            return utils.handleMutationResponse(response);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tournament", tournamentId] });
        },
    });
}

export function useDownloadBadges(tournamentId: string) {
    return useMutation({
        mutationFn: (filenames?: { badgeId: string; filename: string }[]) => downloadBadges(tournamentId, filenames),
    });
}

export function useUpdateThreadId(tournamentId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (threadId: string) => {
            const response = await updateThreadId(tournamentId, threadId);
            return utils.handleMutationResponse(response);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tournament", tournamentId] });
        },
    });
}

export function useCreateNote(tournamentId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (noteData: IMessageFormData) => {
            const response = await createNote(tournamentId, noteData);
            return utils.handleMutationResponse(response);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tournament", tournamentId] });
        },
    });
}

export function useDeleteTournament(tournamentId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const response = await deleteTournament(tournamentId);
            return utils.handleMutationResponse(response);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tournaments"] });
        },
    });
}
