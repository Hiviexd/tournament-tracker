import { useQuery } from "@tanstack/react-query";
import utils from "@tc/utils/client";
import { IDashboardResponse } from "@tc/types/Dashboard";

export function useDashboard() {
    return useQuery({
        queryKey: ["dashboard"],
        queryFn: () => utils.apiCall<IDashboardResponse>({ method: "get", url: "/api/dashboard" }),
    });
}
