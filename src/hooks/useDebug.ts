import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSession, updateSession, UpdateSessionBody } from "../api/debug";
import { handleMutationResponse } from "../api/helpers";
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
            return handleMutationResponse(response);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["session"] });
        },
    });
}
