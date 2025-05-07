import { useQuery } from "@tanstack/react-query";
import utils from "../../utils";
import { LogQueryParams } from "../../interfaces/Log";

export function useLogs(params?: LogQueryParams) {
    return useQuery({
        queryKey: ["logs", params],
        queryFn: () =>
            utils.apiCall({
                method: "get",
                url: "/api/logs",
                params,
            }),
    });
}
