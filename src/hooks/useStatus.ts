import { useQuery } from "@tanstack/react-query";
import utils from "../../utils";
import { StatusInfo } from "../../interfaces/Status";

export const useStatus = () => {
    return useQuery<StatusInfo>({
        queryKey: ["status"],
        queryFn: () =>
            utils.apiCall({
                method: "get",
                url: "/api/status",
            }),
        // Disable caching
        gcTime: 0,
        refetchInterval: 3 * 60 * 1000, // Every 3 minutes
        // Don't show stale data while refetching
        staleTime: 0,
    });
};
