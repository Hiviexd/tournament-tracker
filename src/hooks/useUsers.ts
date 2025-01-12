import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { searchUsers, createUser, getCommitteeUsers, getUserById } from "../api/users";
import { handleMutationResponse } from "../api/helpers";

interface CommitteeUsersOptions {
    enabled?: boolean;
}

export function useUsers(search: string, limit?: number) {
    return useQuery({
        queryKey: ["users", search, limit],
        queryFn: () => searchUsers(search, limit),
        enabled: !!search,
    });
}

export function useCreateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (userData: any) => {
            const response = await createUser(userData);
            return handleMutationResponse(response, "User created successfully");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
        },
    });
}

export function useCommitteeUsers(options: CommitteeUsersOptions = {}) {
    return useQuery({
        queryKey: ["committeeUsers"],
        queryFn: getCommitteeUsers,
        enabled: options.enabled,
    });
}

export function useUser(id: string | null, options: { enabled?: boolean, retry?: boolean } = {}) {
    return useQuery({
        queryKey: ["user", id],
        queryFn: () => getUserById(id!),
        enabled: options.enabled ?? !!id,
        retry: options.retry ?? false,
    });
}
