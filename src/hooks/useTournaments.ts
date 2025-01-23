import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    getTournaments,
    getTournament,
    createTournament,
    assignReviewers,
    TournamentQueryParams,
} from "../api/tournaments";
import { handleMutationResponse } from "../api/helpers";
import { ITournament } from "../../interfaces/Tournament";

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
        mutationFn: async (tournamentData: Partial<ITournament>) => {
            const response = await createTournament(tournamentData);
            return handleMutationResponse(response, "Tournament created successfully");
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
            return handleMutationResponse(response, "Reviewers assigned successfully");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tournament", tournamentId] });
        },
    });
}
