import { useQuery } from "@tanstack/react-query";
import utils, { isPlainObject, isString } from "@tc/utils/client";
import { StatusInfo } from "@tc/types/Status";

const HEALTHY_REFETCH_INTERVAL_MS = 3 * 60 * 1000;
const OUTAGE_REFETCH_INTERVAL_MS = 30 * 1000;

async function fetchStatus(): Promise<StatusInfo> {
    const result = await utils.apiCall<StatusInfo>({
        method: "get",
        url: "/api/status",
    });

    if (!isPlainObject(result) || "error" in result) {
        throw new Error(
            isPlainObject(result) && "error" in result && isString(result.error)
                ? result.error
                : "Failed to fetch status",
        );
    }

    if (!isPlainObject(result.version) || !isString(result.version.hash) || !result.version.hash) {
        throw new Error("Failed to fetch status");
    }

    // SAFETY: status endpoint JSON matches StatusInfo after rejecting error payloads and requiring version.hash.
    return result as StatusInfo;
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
