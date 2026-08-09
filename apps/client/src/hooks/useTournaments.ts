import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import utils from "@tc/utils/client";
import { ITournamentCreateResponse, TournamentFormData, TournamentStatus } from "@tc/types/Tournament";
import { IReview } from "@tc/types/Review";
import { IMessageFormData } from "@tc/types/Message";

export function useTournaments(params?: any) {
    return useQuery({
        queryKey: ["tournaments", params],
        queryFn: () =>
            utils.apiCall({
                method: "get",
                url: "/api/tournaments",
                params,
            }),
    });
}

export function useTournament(tournamentId: string) {
    return useQuery({
        queryKey: ["tournament", tournamentId],
        queryFn: () =>
            utils.apiCall({
                method: "get",
                url: `/api/tournaments/${tournamentId}`,
            }),
        select: (data) => ({
            tournament: data.tournament,
            reports: data.reports || [],
            votings: data.votings || [],
        }),
    });
}

export function useCreateTournament() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (tournamentData: TournamentFormData) => {
            const response = await utils.apiCall<ITournamentCreateResponse>({
                method: "post",
                url: "/api/tournaments/create",
                data: tournamentData,
            });
            return utils.handleMutationResponse<ITournamentCreateResponse>(response);
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
            const response = await utils.apiCall({
                method: "patch",
                url: `/api/tournaments/${tournamentId}/assignReviewers`,
            });
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
            const response = await utils.apiCall({
                method: "put",
                url: `/api/tournaments/${tournamentId}/edit`,
                data: tournamentData,
            });
            return utils.handleMutationResponse(response);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tournament", tournamentId] });
        },
    });
}

export function useBulkEditTournaments() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (bulkData: { tournamentIds: string[]; status?: TournamentStatus; isActive?: boolean }) => {
            const response = await utils.apiCall({
                method: "patch",
                url: "/api/tournaments/bulkEdit",
                data: bulkData,
            });
            return utils.handleMutationResponse(response);
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["tournaments"] });

            const tournamentIds = variables.tournamentIds || [];
            tournamentIds.forEach((tournamentId) => {
                queryClient.invalidateQueries({ queryKey: ["tournament", tournamentId] });
            });
        },
    });
}

export function useReassignReviewer(tournamentId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ oldReviewerId, newReviewerId }: { oldReviewerId: string; newReviewerId: string }) => {
            const response = await utils.apiCall({
                method: "patch",
                url: `/api/tournaments/${tournamentId}/reassignReviewer`,
                data: { oldReviewerId, newReviewerId },
            });
            return utils.handleMutationResponse(response);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tournament", tournamentId] });
        },
    });
}

export function useAddReviewer(tournamentId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (reviewerId: string) => {
            const response = await utils.apiCall({
                method: "patch",
                url: `/api/tournaments/${tournamentId}/addReviewer`,
                data: { reviewerId },
            });
            return utils.handleMutationResponse(response);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tournament", tournamentId] });
        },
    });
}

export function useRemoveReviewer(tournamentId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (reviewerId: string) => {
            const response = await utils.apiCall({
                method: "patch",
                url: `/api/tournaments/${tournamentId}/removeReviewer`,
                data: { reviewerId },
            });
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
            const response = await utils.apiCall({
                method: "patch",
                url: `/api/tournaments/${tournamentId}/submitReview`,
                data: reviewData,
            });
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
            const formData = new FormData();
            badgeFiles.forEach((file) => formData.append("files", file));
            const response = await utils.apiCall({
                method: "post",
                url: `/api/tournaments/${tournamentId}/uploadBadges`,
                data: formData,
                headers: { "Content-Type": "multipart/form-data" },
            });
            return utils.handleMutationResponse(response);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tournament", tournamentId] });
        },
    });
}

export function useDownloadBadges(tournamentId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (filenames?: { badgeId: string; filename: string }[]) => {
            const response = await utils.apiCall({
                method: "post",
                url: `/api/tournaments/${tournamentId}/downloadBadges`,
                data: filenames,
                responseType: "blob",
            });

            // Create a download link and trigger it
            const url = window.URL.createObjectURL(response.data);
            const a = document.createElement("a");
            a.href = url;
            const filename = response.headers["content-disposition"]?.split("filename=")[1] || "badges.zip";
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tournament", tournamentId] });
        },
    });
}

export function useUpdateThreadId(tournamentId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (threadId: string) => {
            const response = await utils.apiCall({
                method: "patch",
                url: `/api/tournaments/${tournamentId}/updateThreadId`,
                data: { threadId },
            });
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
            const response = await utils.apiCall({
                method: "post",
                url: `/api/tournaments/${tournamentId}/createNote`,
                data: noteData,
            });
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
            const response = await utils.apiCall({
                method: "delete",
                url: `/api/tournaments/${tournamentId}/delete`,
            });
            return utils.handleMutationResponse(response);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tournaments"] });
        },
    });
}
