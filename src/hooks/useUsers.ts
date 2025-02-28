import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    searchUsers,
    createUser,
    getCommitteeUsers,
    getUserById,
    toggleReviewerStatus,
    updateUserGroup,
    updateUserBadge,
    syncUser,
    updateDiscordId,
} from "../api/users";
import { handleMutationResponse } from "../api/helpers";
import { useAtom } from "jotai";
import { loggedInUserAtom, selectedUserAtom } from "../store/atoms";
import { IUser, UpdateUserGroupsRequest, UpdateBadgeRequest } from "../../interfaces/User";

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
            return handleMutationResponse(response);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
        },
    });
}

export function useCommitteeUsers(options: { enabled?: boolean; includeAlumni?: boolean } = {}) {
    return useQuery({
        queryKey: ["committeeUsers", options.includeAlumni],
        queryFn: () => getCommitteeUsers(options.includeAlumni),
        enabled: options.enabled ?? true,
    });
}

export function useUser(id: string | null, options: { enabled?: boolean; retry?: boolean } = {}) {
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
            return handleMutationResponse(response);
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["user", userId] });
            queryClient.invalidateQueries({ queryKey: ["committeeUsers"] });

            // Update loggedInUser when relevant
            if (loggedInUser?._id === userId) {
                queryClient.invalidateQueries({ queryKey: ["loggedInUser"] });
                const res = data as { message: string; user: IUser };
                setLoggedInUser(res.user as IUser);
            }
        },
    });
}

export function useUpdateUserGroups(userId: string) {
    const queryClient = useQueryClient();
    const [selectedUser, setSelectedUser] = useAtom(selectedUserAtom);

    return useMutation({
        mutationFn: async (data: UpdateUserGroupsRequest) => {
            const response = await updateUserGroup(data);
            return handleMutationResponse(response);
        },
        onSuccess: (data) => {
            // Invalidate relevant queries
            queryClient.invalidateQueries({ queryKey: ["users"] });
            queryClient.invalidateQueries({ queryKey: ["committeeUsers"] });
            queryClient.invalidateQueries({ queryKey: ["logs"] });

            // Update selectedUser if it matches
            if (selectedUser?._id === userId) {
                const res = data as { message: string; user: IUser };
                setSelectedUser(res.user as IUser);
            }
        },
    });
}

export function useUpdateUserBadge(userId: string) {
    const queryClient = useQueryClient();
    const [selectedUser, setSelectedUser] = useAtom(selectedUserAtom);

    return useMutation({
        mutationFn: async (data: UpdateBadgeRequest) => {
            const response = await updateUserBadge(data);
            return handleMutationResponse(response);
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            queryClient.invalidateQueries({ queryKey: ["committeeUsers"] });
            queryClient.invalidateQueries({ queryKey: ["logs"] });

            // Update selectedUser if it matches
            if (selectedUser?._id === userId) {
                const res = data as { message: string; user: IUser };
                setSelectedUser(res.user as IUser);
            }
        },
    });
}

export function useSyncUser(userId: string) {
    const queryClient = useQueryClient();
    const [selectedUser, setSelectedUser] = useAtom(selectedUserAtom);

    return useMutation({
        mutationFn: async (userId: string) => {
            const response = await syncUser(userId);
            return handleMutationResponse(response);
        },
        onSuccess: (data) => {
            // Invalidate all relevant queries
            queryClient.invalidateQueries({ queryKey: ["users"] });
            queryClient.invalidateQueries({ queryKey: ["committeeUsers"] });

            // Update selectedUser if it matches
            if (selectedUser?._id === userId) {
                const res = data as { message: string; user: IUser };
                setSelectedUser(res.user as IUser);
            }
        },
    });
}

export function useUpdateDiscordId(userId: string) {
    const queryClient = useQueryClient();
    const [loggedInUser, setLoggedInUser] = useAtom(loggedInUserAtom);

    return useMutation({
        mutationFn: async (discordId: string) => {
            const response = await updateDiscordId(userId, discordId);
            return handleMutationResponse(response);
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["user", userId] });
            queryClient.invalidateQueries({ queryKey: ["committeeUsers"] });

            // Update loggedInUser when relevant
            if (loggedInUser?._id === userId) {
                queryClient.invalidateQueries({ queryKey: ["loggedInUser"] });
                const res = data as { message: string; user: IUser };
                setLoggedInUser(res.user as IUser);
            }
        },
    });
}
