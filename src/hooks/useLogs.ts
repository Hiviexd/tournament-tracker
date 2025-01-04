import { useQuery } from "@tanstack/react-query";
import { getLogs } from "../api/logs";

export function useLogs(params?) {
    return useQuery({
        queryKey: ["logs", params],
        queryFn: () => getLogs(params),
    });
}
