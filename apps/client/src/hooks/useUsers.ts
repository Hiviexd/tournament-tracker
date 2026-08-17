import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import utils from "@tc/utils/client";
import { useAtom } from "jotai";
import { loggedInUserAtom, selectedUserAtom } from "../store/atoms";
import { IUser, UpdateUserGroupsRequest, UpdateBadgeRequest } from "@tc/types/User";
import { IOsuUser } from "@tc/types/OsuApi";
import { ITicket } from "@tc/types/Ticket";
import { IVoting } from "@tc/types/Voting";

type UserMutationResult = { message: string; user: IUser };

export function useUsers(search: string, limit?: number) {
    return useQuery({
        queryKey: ["users", search, limit],
        queryFn: () =>
            utils.apiCall<IUser[]>({
                method: "get",
                url: "/api/users",
                params: { userInput: search, limit },
            }),
        enabled: !!search,
    });
}

export function useCreateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (userInput: string) => {
            const response = await utils.apiCall<UserMutationResult>({
                method: "post",
                url: "/api/users/create",
                data: { userInput },
            });
            return utils.handleMutationResponse<UserMutationResult>(response);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
        },
    });
}

export function useCommitteeUsers(options: { enabled?: boolean; includeAlumni?: boolean } = {}) {
    return useQuery({
        queryKey: ["committeeUsers", options.includeAlumni],
        queryFn: () =>
            utils.apiCall<IUser[]>({
                method: "get",
                url: "/api/users/getCommittee",
                params: { includeAlumni: options.includeAlumni },
            }),
        enabled: options.enabled ?? true,
    });
}

export function useUser(id: string | null, options: { enabled?: boolean; retry?: boolean } = {}) {
    return useQuery({
        queryKey: ["user", id],
        queryFn: () =>
            utils.apiCall<IUser>({
                method: "get",
                url: `/api/users/${id}`,
            }),
        enabled: options.enabled ?? !!id,
        retry: options.retry ?? false,
    });
}

export function useOsuUserInfo(userInput: string) {
    return useQuery({
        queryKey: ["osuUserInfo", userInput],
        queryFn: async () => {
            const response = await utils.apiCall<IOsuUser>({
                method: "get",
                url: `/api/users/${userInput}/osu`,
            });
            if (response && "error" in response) {
                return utils.handleMutationResponse<IOsuUser>(response);
            }
            return response;
        },
        enabled: !!userInput,
        retry: false,
    });
}

export function useUpdateNewsSubscription() {
    const queryClient = useQueryClient();
    const [, setLoggedInUser] = useAtom(loggedInUserAtom);

    return useMutation({
        mutationFn: async (isSubscribedToNews: boolean) => {
            const response = await utils.apiCall<UserMutationResult>({
                method: "patch",
                url: "/api/users/me/newsSubscription",
                data: { isSubscribedToNews },
            });
            return utils.handleMutationResponse<UserMutationResult>(response);
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["loggedInUser"] });
            setLoggedInUser(data.user);
        },
    });
}

export function useToggleReviewerStatus(userId: string) {
    const queryClient = useQueryClient();
    const [loggedInUser, setLoggedInUser] = useAtom(loggedInUserAtom);

    return useMutation({
        mutationFn: async () => {
            const response = await utils.apiCall<UserMutationResult>({
                method: "patch",
                url: `/api/users/${userId}/toggleReviewerStatus`,
            });
            return utils.handleMutationResponse<UserMutationResult>(response);
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["user", userId] });
            queryClient.invalidateQueries({ queryKey: ["committeeUsers"] });
            if (loggedInUser?.id === userId) {
                queryClient.invalidateQueries({ queryKey: ["loggedInUser"] });
                setLoggedInUser(data.user);
            }
        },
    });
}

export function useToggleVoterStatus(userId: string) {
    const queryClient = useQueryClient();
    const [loggedInUser, setLoggedInUser] = useAtom(loggedInUserAtom);

    return useMutation({
        mutationFn: async () => {
            const response = await utils.apiCall<UserMutationResult>({
                method: "patch",
                url: `/api/users/${userId}/toggleVoterStatus`,
            });
            return utils.handleMutationResponse<UserMutationResult>(response);
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["user", userId] });
            queryClient.invalidateQueries({ queryKey: ["committeeUsers"] });
            if (loggedInUser?.id === userId) {
                queryClient.invalidateQueries({ queryKey: ["loggedInUser"] });
                setLoggedInUser(data.user);
            }
        },
    });
}

export function useUpdateUserGroups(userId: string) {
    const queryClient = useQueryClient();
    const [selectedUser, setSelectedUser] = useAtom(selectedUserAtom);

    return useMutation({
        mutationFn: async (data: UpdateUserGroupsRequest) => {
            const response = await utils.apiCall<UserMutationResult>({
                method: "patch",
                url: `/api/users/${userId}/groupMove`,
                data: { group: data.group, join: data.join },
            });
            return utils.handleMutationResponse<UserMutationResult>(response);
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            queryClient.invalidateQueries({ queryKey: ["committeeUsers"] });
            queryClient.invalidateQueries({ queryKey: ["logs"] });
            if (selectedUser?.id === userId) {
                setSelectedUser(data.user);
            }
        },
    });
}

export function useUpdateUserBadge(userId: string) {
    const queryClient = useQueryClient();
    const [selectedUser, setSelectedUser] = useAtom(selectedUserAtom);

    return useMutation({
        mutationFn: async (data: UpdateBadgeRequest) => {
            const response = await utils.apiCall<UserMutationResult>({
                method: "patch",
                url: `/api/users/${userId}/updateBadge`,
                data: { increment: data.increment },
            });
            return utils.handleMutationResponse<UserMutationResult>(response);
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            queryClient.invalidateQueries({ queryKey: ["committeeUsers"] });
            queryClient.invalidateQueries({ queryKey: ["logs"] });
            if (selectedUser?.id === userId) {
                setSelectedUser(data.user);
            }
        },
    });
}

export function useSyncUser(userId: string) {
    const queryClient = useQueryClient();
    const [selectedUser, setSelectedUser] = useAtom(selectedUserAtom);

    return useMutation({
        mutationFn: async () => {
            const response = await utils.apiCall<UserMutationResult>({
                method: "patch",
                url: `/api/users/${userId}/sync`,
            });
            return utils.handleMutationResponse<UserMutationResult>(response);
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            queryClient.invalidateQueries({ queryKey: ["committeeUsers"] });
            if (selectedUser?.id === userId) {
                setSelectedUser(data.user);
            }
        },
    });
}

export function useUpdateDiscordId(userId: string) {
    const queryClient = useQueryClient();
    const [loggedInUser, setLoggedInUser] = useAtom(loggedInUserAtom);

    return useMutation({
        mutationFn: async (discordId: string) => {
            const response = await utils.apiCall<UserMutationResult>({
                method: "patch",
                url: `/api/users/${userId}/updateDiscordId`,
                data: { discordId },
            });
            return utils.handleMutationResponse<UserMutationResult>(response);
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["user", userId] });
            queryClient.invalidateQueries({ queryKey: ["committeeUsers"] });
            if (loggedInUser?.id === userId) {
                queryClient.invalidateQueries({ queryKey: ["loggedInUser"] });
                setLoggedInUser(data.user);
            }
        },
    });
}

export function useUpdateEmail(userId: string) {
    const queryClient = useQueryClient();
    const [loggedInUser, setLoggedInUser] = useAtom(loggedInUserAtom);

    return useMutation({
        mutationFn: async (email: string) => {
            const response = await utils.apiCall<UserMutationResult>({
                method: "patch",
                url: `/api/users/${userId}/updateEmail`,
                data: { email },
            });
            return utils.handleMutationResponse<UserMutationResult>(response);
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["user", userId] });
            queryClient.invalidateQueries({ queryKey: ["committeeUsers"] });
            if (loggedInUser?.id === userId) {
                queryClient.invalidateQueries({ queryKey: ["loggedInUser"] });
                setLoggedInUser(data.user);
            }
        },
    });
}

export function useReviewStats(userId: string, days: number = 180) {
    return useQuery({
        queryKey: ["reviewStats", userId, days],
        queryFn: () =>
            utils.apiCall({
                method: "get",
                url: `/api/users/${userId}/reviewStats?days=${days}`,
            }),
        enabled: !!userId,
    });
}

export function useCycleBag() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () =>
            utils.apiCall<{ message: string; reviewers: IUser[] }>({
                method: "patch",
                url: "/api/users/cycleBag",
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["committeeUsers"] });
        },
    });
}

export function useRelatedReportsAndVotings(userId: string) {
    return useQuery({
        queryKey: ["relatedReportsAndVotings", userId],
        queryFn: () =>
            utils.apiCall<{ reports: ITicket[]; votings: IVoting[] }>({
                method: "get",
                url: `/api/users/${userId}/relatedReportsAndVotings`,
            }),
        enabled: !!userId,
    });
}
