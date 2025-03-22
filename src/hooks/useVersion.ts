import { useQuery } from "@tanstack/react-query";
import { getVersion } from "../api/version";

export const useVersion = () => {
    return useQuery({
        queryKey: ["version"],
        queryFn: getVersion,
        // Disable caching
        gcTime: 0,
        // Check for updates in the background
        refetchInterval: 60 * 1000, // Every minute
        refetchIntervalInBackground: true,
        // Don't show stale data while refetching
        staleTime: 0,
    });
};
