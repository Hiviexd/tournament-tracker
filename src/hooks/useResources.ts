import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import utils from "../../utils";
import { IResource, type ResourceQueryParams } from "../../interfaces/Resource";

export function useResources(params?: ResourceQueryParams) {
    return useQuery({
        queryKey: ["resources", params],
        queryFn: () =>
            utils.apiCall({
                method: "get",
                url: "/api/resources",
                params,
            }),
    });
}

export function useCreateResource() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (resourceData: Partial<IResource>) => {
            const response = await utils.apiCall({
                method: "post",
                url: "/api/resources/create",
                data: resourceData,
            });
            return utils.handleMutationResponse(response);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["resources"] });
        },
    });
}

export function useUpdateResource(resourceId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (resourceData: Partial<IResource>) => {
            const response = await utils.apiCall({
                method: "put",
                url: `/api/resources/${resourceId}/edit`,
                data: resourceData,
            });
            return utils.handleMutationResponse(response);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["resources"] });
        },
    });
}

export function useDeleteResource(resourceId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const response = await utils.apiCall({
                method: "delete",
                url: `/api/resources/${resourceId}/delete`,
            });
            return utils.handleMutationResponse(response);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["resources"] });
        },
    });
}
