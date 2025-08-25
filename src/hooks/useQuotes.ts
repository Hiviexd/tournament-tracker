import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import utils from "../../utils";

export function useRandomQuote() {
    return useQuery({
        queryKey: ["quote"],
        queryFn: () =>
            utils.apiCall({
                method: "get",
                url: "/api/quotes",
            }),
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
    });
}

export function useAllQuotes() {
    return useQuery({
        queryKey: ["quotes"],
        queryFn: () =>
            utils.apiCall({
                method: "get",
                url: "/api/quotes/all",
            }),
    });
}

export function useCreateQuote(authorId: string, quote: string, creationDate?: Date) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const response = await utils.apiCall({
                method: "post",
                url: "/api/quotes/create",
                data: { authorId, quote, creationDate },
            });
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
