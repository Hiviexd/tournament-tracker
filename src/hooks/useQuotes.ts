import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRandomQuote, getAllQuotes, createQuote } from "../api/quotes";
import utils from "../../utils";

export function useRandomQuote() {
    return useQuery({
        queryKey: ["quote"],
        queryFn: getRandomQuote,
    });
}

export function useAllQuotes() {
    return useQuery({
        queryKey: ["quotes"],
        queryFn: getAllQuotes,
    });
}

export function useCreateQuote(authorId: string, quote: string, creationDate?: Date) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const response = await createQuote(authorId, quote, creationDate);
            return utils.handleMutationResponse(response);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["quotes"] });
        },
        onError: (error) => {
            console.error("Create quote error:", error);
        },
    });
}
