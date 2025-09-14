import { useMutation, useQueryClient } from "@tanstack/react-query";
import utils from "../../utils";
import { IValidateBeatmapsResponse } from "@interfaces/ComplianceApi";

export function useValidateBeatmaps(input: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const response = await utils.apiCall({
                method: "post",
                url: "/api/compliance/validate",
                data: { input },
            });
            return utils.handleMutationResponse<IValidateBeatmapsResponse>(response);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["compliance"] });
        },
    });
}
