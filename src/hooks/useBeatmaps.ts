import { useMutation, useQueryClient } from "@tanstack/react-query";
import utils from "../../utils";

export function useMappoolCompliance(input: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const response = await utils.apiCall({
                method: "post",
                url: "/api/beatmaps/check",
                data: { input },
            });
            return utils.handleMutationResponse(response);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["beatmaps"] });
        },
    });
}
