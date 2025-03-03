import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getArticle, getDocumentation, createArticle, editArticle, type CreateArticleData } from "../api/articles";
import { handleMutationResponse } from "../api/helpers";

export function useArticle(slug: string) {
    return useQuery({
        queryKey: ["article", slug],
        queryFn: () => getArticle(slug),
    });
}

export function useDocumentation() {
    return useQuery({
        queryKey: ["documentation"],
        queryFn: () => getDocumentation(),
    });
}

export function useCreateArticle() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: CreateArticleData) => {
            const response = await createArticle(data);
            return handleMutationResponse(response);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["documentation"] });
        },
    });
}

export function useEditArticle(slug: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (content: string) => {
            const response = await editArticle(slug, content);
            return handleMutationResponse(response);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["article", slug] });
        },
    });
}
