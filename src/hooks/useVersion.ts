import { useQuery } from "@tanstack/react-query";
import utils from "../../utils";
import { VersionInfo } from "../../interfaces/Version";

export const useVersion = () => {
    return useQuery<VersionInfo>({
        queryKey: ["version"],
        queryFn: () =>
            utils.apiCall({
                method: "get",
                url: "/api/version",
            }),
        // Disable caching
        gcTime: 0,
        refetchInterval: 3 * 60 * 1000, // Every 3 minutes
        // Don't show stale data while refetching
        staleTime: 0,
    });
};
