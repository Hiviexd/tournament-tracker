import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import utils from "../../utils";
import { useAtom } from "jotai";
import { selectedUserAtom } from "../store/atoms";
import { IUser } from "../../interfaces/User";

export function useWatchlist(params?: { userInput?: string; infringementType?: string }) {
    return useQuery({
        queryKey: ["watchlist", params],
        queryFn: () =>
            utils.apiCall<IUser[]>({
                method: "get",
                url: "/api/infringements/watchlist",
                params,
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
            queryClient.invalidateQueries({ queryKey: ["user", userId] });

            if (selectedUser?.id === userId) {
                const res = responseData as { message: string; user: IUser };
                if (res.user) {
                    setSelectedUser(res.user);
                }
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
            queryClient.invalidateQueries({ queryKey: ["user", userId] });

            if (selectedUser?.id === userId) {
                const res = responseData as { message: string; user: IUser };
                if (res.user) {
                    setSelectedUser(res.user);
                }
            }
        },
    });
}
