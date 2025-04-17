import { useMutation, useQueryClient } from "@tanstack/react-query";
import { checkMappoolCompliance } from "../api/beatmaps";
import utils from "../../utils";

export function useMappoolCompliance(input: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const response = await checkMappoolCompliance(input);
            return utils.handleMutationResponse(response);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["beatmaps"] });
        },
    });
}
