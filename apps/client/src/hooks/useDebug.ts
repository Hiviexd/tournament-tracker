import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import utils from "@tc/utils/client";
import {
    INotificationJobListItem,
    INotificationJobsListQuery,
    INotificationJobsListResponse,
    INotificationStatsResponse,
} from "@tc/types/NotificationJob";

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

export function useNotificationQueueStats() {
    return useQuery({
        queryKey: ["notificationQueueStats"],
        staleTime: 2_000,
        gcTime: 15_000,
        refetchInterval: 3_000,
        refetchIntervalInBackground: true,
        queryFn: () =>
            utils.apiCall<INotificationStatsResponse>({
                method: "get",
                url: "/api/dev/notifications/stats",
            }),
    });
}

export function useRetryNotificationJob() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (jobId: string) => {
            const response = await utils.apiCall<{ message: string; job: INotificationJobListItem }>({
                method: "post",
                url: `/api/dev/notifications/${jobId}/retry`,
            });
            return utils.handleMutationResponse(response);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notificationJobsListing"] });
            queryClient.invalidateQueries({ queryKey: ["notificationQueueStats"] });
        },
    });
}

export function useNotificationJobsListing(params: INotificationJobsListQuery, enabled: boolean = true) {
    return useQuery({
        queryKey: ["notificationJobsListing", params],
        enabled,
        staleTime: 2_000,
        gcTime: 15_000,
        refetchInterval: enabled ? 3_000 : false,
        refetchIntervalInBackground: true,
        queryFn: () =>
            utils.apiCall<INotificationJobsListResponse>({
                method: "get",
                url: "/api/dev/notifications",
                params,
            }),
    });
}
