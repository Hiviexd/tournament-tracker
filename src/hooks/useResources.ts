import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getResources, createResource, updateResource } from "../api/resources";
import { handleMutationResponse } from "../api/helpers";
import { IResource, type ResourceQueryParams } from "../../interfaces/Resource";

export function useResources(params?: ResourceQueryParams) {
    return useQuery({
        queryKey: ["resources", params],
        queryFn: () => getResources(params),
    });
}

export function useCreateResource() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (resourceData: Partial<IResource> ) => {
            const response = await createResource(resourceData);
            return handleMutationResponse(response);
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
            const response = await updateResource(resourceId, resourceData);
            return handleMutationResponse(response);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["resources"] });
        },
    });
}
