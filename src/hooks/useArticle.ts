import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import utils from "../../utils";

export function useArticle(slug: string) {
    return useQuery({
        queryKey: ["article", slug],
        queryFn: () =>
            utils.apiCall({
                method: "get",
                url: `/api/articles/${slug}`,
            }),
    });
}

export function useDocumentation() {
    return useQuery({
        queryKey: ["documentation"],
        queryFn: () =>
            utils.apiCall({
                method: "get",
                url: "/api/articles/documentation",
            }),
    });
}

export function useCreateArticle() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: any) => {
            const response = await utils.apiCall({
                method: "post",
                url: "/api/articles/create",
                data,
            });
            return utils.handleMutationResponse(response);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["documentation"] });
        },
    });
}

export function useEditArticle(slug: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { title?: string; content?: string }) => {
            const response = await utils.apiCall({
                method: "put",
                url: `/api/articles/${slug}/edit`,
                data,
            });
            return utils.handleMutationResponse(response);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["article", slug] });
            queryClient.invalidateQueries({ queryKey: ["documentation"] });
        },
    });
}

export function useDeleteArticle(slug: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const response = await utils.apiCall({
                method: "delete",
                url: `/api/articles/${slug}/delete`,
            });
            return utils.handleMutationResponse(response);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["article", slug] });
            queryClient.invalidateQueries({ queryKey: ["documentation"] });
        },
    });
}
