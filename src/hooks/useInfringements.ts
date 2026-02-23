import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import utils from "../../utils";
import { useAtom } from "jotai";
import { selectedUserAtom } from "../store/atoms";
import { IUser } from "../../interfaces/User";

export interface WatchlistResponse {
    users: IUser[];
    total: number;
    page: number;
    pages: number;
}

export function useWatchlist(params?: {
    infringementType?: string;
    page?: number;
    limit?: number;
}) {
    return useQuery({
        queryKey: ["watchlist", params],
        queryFn: () =>
            utils.apiCall<WatchlistResponse>({
                method: "get",
                url: "/api/infringements/watchlist",
                params: params
                    ? {
                          infringementType: params.infringementType,
                          page: params.page,
                          limit: params.limit,
                      }
                    : undefined,
            }),
    });
}

export function useAddInfringement() {
    const queryClient = useQueryClient();
    const [selectedUser, setSelectedUser] = useAtom(selectedUserAtom);

    return useMutation({
        mutationFn: async (data: {
            userId: string;
            type: string;
            startDate: Date;
            endDate: Date;
            reason: string;
            threadId?: string;
            enchantUrl?: string;
        }) => {
            const response = await utils.apiCall({
                method: "post",
                url: `/api/infringements/${data.userId}`,
                data: {
                    type: data.type,
                    startDate: data.startDate,
                    endDate: data.endDate,
                    reason: data.reason,
                    threadId: data.threadId,
                    enchantUrl: data.enchantUrl,
                },
            });
            return utils.handleMutationResponse(response);
        },
        onSuccess: (responseData, variables) => {
            const userId = variables.userId;

            queryClient.invalidateQueries({ queryKey: ["watchlist"] });
            queryClient.invalidateQueries({ queryKey: ["users"] });
            queryClient.invalidateQueries({ queryKey: ["committeeUsers"] });
            queryClient.invalidateQueries({ queryKey: ["user"] });

            const res = responseData as { message: string; user: IUser };
            if (res.user) {
                setSelectedUser(res.user);
                // Update modal's useUser cache (URL uses osuId; key may be id or osuId)
                queryClient.setQueryData(["user", res.user.osuId.toString()], res.user);
                if (res.user.id) queryClient.setQueryData(["user", res.user.id], res.user);
            }
        },
    });
}

export function useUpdateInfringement() {
    const queryClient = useQueryClient();
    const [selectedUser, setSelectedUser] = useAtom(selectedUserAtom);

    return useMutation({
        mutationFn: async (data: {
            userId: string;
            infringementId: string;
            startDate: Date;
            endDate: Date;
            reason: string;
            threadId?: string;
            enchantUrl?: string;
        }) => {
            const response = await utils.apiCall({
                method: "patch",
                url: `/api/infringements/${data.infringementId}`,
                data: {
                    userId: data.userId,
                    startDate: data.startDate,
                    endDate: data.endDate,
                    reason: data.reason,
                    threadId: data.threadId,
                    enchantUrl: data.enchantUrl,
                },
            });
            return utils.handleMutationResponse(response);
        },
        onSuccess: (responseData, variables) => {
            const userId = variables.userId;

            queryClient.invalidateQueries({ queryKey: ["watchlist"] });
            queryClient.invalidateQueries({ queryKey: ["users"] });
            queryClient.invalidateQueries({ queryKey: ["committeeUsers"] });
            queryClient.invalidateQueries({ queryKey: ["user"] });

            const res = responseData as { message: string; user: IUser };
            if (res.user) {
                setSelectedUser(res.user);
                // Update modal's useUser cache (URL uses osuId; key may be id or osuId)
                queryClient.setQueryData(["user", res.user.osuId.toString()], res.user);
                if (res.user.id) queryClient.setQueryData(["user", res.user.id], res.user);
            }
        },
    });
}
