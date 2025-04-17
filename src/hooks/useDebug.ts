import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSession, updateSession, UpdateSessionBody } from "../api/debug";
import utils from "../../utils";

export function useSession() {
    return useQuery({
        queryKey: ["session"],
        queryFn: getSession,
    });
}

export function useUpdateSession(data: UpdateSessionBody) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const response = await updateSession(data);
            return utils.handleMutationResponse(response);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["session"] });
        },
    });
}
