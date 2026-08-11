import { useQuery } from "@tanstack/react-query";
import utils from "@tc/utils/client";
import { IReviewChecklists } from "@tc/types/Checklist";

export function useReviewChecklists() {
    return useQuery({
        queryKey: ["checklist"],
        queryFn: () =>
            utils.apiCall<IReviewChecklists>({
                method: "get",
                url: "/api/checklist",
            }),
        staleTime: Infinity,
        refetchOnWindowFocus: false,
    });
}
