import { useMutation, useQueryClient } from "@tanstack/react-query";
import { checkMappoolCompliance } from "../api/beatmaps";
import { handleMutationResponse } from "../api/helpers";

export function useMappoolCompliance(input: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const response = await checkMappoolCompliance(input);
            return handleMutationResponse(response);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["beatmaps"] });
        },
    });
}
