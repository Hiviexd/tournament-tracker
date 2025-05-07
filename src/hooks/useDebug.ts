import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import utils from "../../utils";

export function useSession() {
    return useQuery({
        queryKey: ["session"],
        queryFn: () =>
            utils.apiCall({
                method: "get",
                url: "/api/dev/session",
            }),
    });
}

export function useUpdateSession(data: { mongoId: string; osuId: string; username: string }) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const response = await utils.apiCall({
                method: "post",
                url: "/api/dev/session/update",
                data,
            });
            return utils.handleMutationResponse(response);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["session"] });
        },
    });
}
