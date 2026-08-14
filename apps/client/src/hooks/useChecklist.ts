import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import utils from "@tc/utils/client";
import { IReviewChecklists } from "@tc/types/Checklist";

export function isReviewChecklists(data: unknown): data is IReviewChecklists {
    if (!data || typeof data !== "object") return false;

    const { tc, cc } = data as IReviewChecklists;
    if (!Array.isArray(tc) || !Array.isArray(cc)) return false;

    const isCategory = (value: unknown) => {
        if (!value || typeof value !== "object") return false;
        const category = value as IReviewChecklists["tc"][number];
        return (
            typeof category.category === "string" &&
            Array.isArray(category.items) &&
            category.items.every((item) => typeof item === "string")
        );
    };

    return tc.every(isCategory) && cc.every(isCategory);
}

export function useReviewChecklists() {
    return useQuery({
        queryKey: ["checklist"],
        queryFn: () =>
            utils.apiCall<IReviewChecklists>({
                method: "get",
                url: "/api/checklist",
            }),
    });
}

export function useUpdateChecklists() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (checklist: IReviewChecklists) => {
            const response = await utils.apiCall<IReviewChecklists>({
                method: "put",
                url: "/api/checklist",
                data: checklist,
            });
            return utils.handleMutationResponse<IReviewChecklists>(response);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["checklist"] });
        },
    });
}
