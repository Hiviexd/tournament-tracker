import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import utils, { isPlainObject, isString } from "@tc/utils/client";
import { IReviewChecklists } from "@tc/types/Checklist";

function isChecklistCategory<T>(value: T): boolean {
    if (!isPlainObject(value)) return false;
    if (!("category" in value) || !("items" in value)) return false;
    return isString(value.category) && Array.isArray(value.items) && value.items.every((item) => isString(item));
}

export function isReviewChecklists<T>(data: T): data is T & IReviewChecklists {
    if (!isPlainObject(data)) return false;
    if (!("tc" in data) || !("cc" in data)) return false;

    const { tc, cc } = data;
    if (!Array.isArray(tc) || !Array.isArray(cc)) return false;

    return tc.every(isChecklistCategory) && cc.every(isChecklistCategory);
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
