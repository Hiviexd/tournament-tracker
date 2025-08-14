import { useQuery, useMutation } from "@tanstack/react-query";
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

export function useExportLogsCsv() {
    return useMutation({
        mutationFn: async () => {
            const response = await utils.apiCall({
                method: "get",
                url: "/api/logs/export",
                responseType: "blob",
            });
            return response.data;
        },
        onSuccess: (data) => {
            // Create a download link
            const url = window.URL.createObjectURL(new Blob([data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", "logs-export.csv");
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        },
        onError: (error) => {
            console.error("Failed to export logs:", error);
        },
    });
}
