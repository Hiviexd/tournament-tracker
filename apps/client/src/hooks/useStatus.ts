import { useQuery } from "@tanstack/react-query";
import utils from "@tc/utils/client";
import { StatusInfo } from "@tc/types/Status";

const HEALTHY_REFETCH_INTERVAL_MS = 3 * 60 * 1000;
const OUTAGE_REFETCH_INTERVAL_MS = 30 * 1000;

async function fetchStatus(): Promise<StatusInfo> {
    const result = await utils.apiCall<StatusInfo>({
        method: "get",
        url: "/api/status",
    });

    if (!result || typeof result !== "object" || "error" in result || !result.version?.hash) {
        throw new Error(
            result && typeof result === "object" && "error" in result && result.error
                ? String(result.error)
                : "Failed to fetch status",
        );
    }

    return result;
}

export const useStatus = () => {
    return useQuery<StatusInfo>({
        queryKey: ["status"],
        queryFn: fetchStatus,
        gcTime: 0,
        staleTime: 0,
        refetchOnMount: false,
        refetchOnWindowFocus: true,
        refetchInterval: (query) =>
            query.state.data?.osuApi.status === "down" ? OUTAGE_REFETCH_INTERVAL_MS : HEALTHY_REFETCH_INTERVAL_MS,
    });
};
