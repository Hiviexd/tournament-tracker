import { useQuery } from "@tanstack/react-query";
import utils from "../../utils";
import { IDashboardResponse } from "../../interfaces/Dashboard";

export function useDashboard() {
    return useQuery({
        queryKey: ["dashboard"],
        queryFn: () => utils.apiCall<IDashboardResponse>({ method: "get", url: "/api/dashboard" }),
    });
}
