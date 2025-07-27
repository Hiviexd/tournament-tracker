import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import utils from "../../utils";
import { ITemplate } from "../../interfaces/Template";

export function useTemplates() {
    return useQuery({
        queryKey: ["templates"],
        queryFn: () =>
            utils.apiCall<ITemplate[]>({
                method: "get",
                url: "/api/templates",
            }),
    });
}

export function useCreateTemplate() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (templateData: { name: string; content: string; category: string }) => {
            const response = await utils.apiCall({
                method: "post",
                url: "/api/templates/create",
                data: templateData,
            });
            return utils.handleMutationResponse(response);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["templates"] });
        },
    });
}

export function useUpdateTemplate(templateId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (templateData: Partial<{ name: string; content: string; category: string }>) => {
            const response = await utils.apiCall({
                method: "put",
                url: `/api/templates/${templateId}/update`,
                data: templateData,
            });
            return utils.handleMutationResponse(response);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["templates"] });
        },
    });
}

export function useDeleteTemplate(templateId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const response = await utils.apiCall({
                method: "delete",
                url: `/api/templates/${templateId}/delete`,
            });
            return utils.handleMutationResponse(response);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["templates"] });
        },
    });
}
