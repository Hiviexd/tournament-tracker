import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { searchUsers, createUser, getCommitteeUsers, getUserById, toggleReviewerStatus } from "../api/users";
import { handleMutationResponse } from "../api/helpers";
import { useAtom } from "jotai";
import { loggedInUserAtom } from "../store/atoms";

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

export function useCommitteeUsers(options: { enabled?: boolean } = {}) {
    return useQuery({
        queryKey: ["committeeUsers"],
        queryFn: getCommitteeUsers,
        enabled: options.enabled ?? true,
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

export function useToggleReviewerStatus(userId: string) {
    const queryClient = useQueryClient();
    const [loggedInUser, setLoggedInUser] = useAtom(loggedInUserAtom);

    return useMutation({
        mutationFn: async () => {
            const response = await toggleReviewerStatus(userId);
            return handleMutationResponse(
                response,
                `Reviewer status updated successfully`
            );
        },
        onSuccess: (updatedUser) => {
            queryClient.invalidateQueries({ queryKey: ["user", userId] });
            queryClient.invalidateQueries({ queryKey: ["committeeUsers"] });

            // Update loggedInUser when relevant
            if (loggedInUser?._id === userId) {
                queryClient.invalidateQueries({ queryKey: ["loggedInUser"] });
                setLoggedInUser(updatedUser);
            }
        }
    });
}