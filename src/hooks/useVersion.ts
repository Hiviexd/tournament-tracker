import { useQuery } from "@tanstack/react-query";
import utils from "../../utils";

export const useVersion = () => {
    return useQuery({
        queryKey: ["version"],
        queryFn: () =>
            utils.apiCall({
                method: "get",
                url: "/api/version",
            }),
        // Disable caching
        gcTime: 0,
        // Check for updates in the background
        refetchInterval: 3 * 60 * 1000, // Every 3 minutes
        refetchIntervalInBackground: true,
        // Don't show stale data while refetching
        staleTime: 0,
    });
};
