import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import utils, { isPlainObject, isString } from "@tc/utils/client";
import { IArticle } from "@tc/types/Article";

export interface INewsListResponse {
    articles: IArticle[];
    total: number;
}

const NEWS_INITIAL_PAGE_SIZE = 3;
const NEWS_LOAD_MORE_SIZE = 2;

export function useNewsPosts() {
    return useInfiniteQuery({
        queryKey: ["newsPosts"],
        queryFn: async ({ pageParam }) => {
            const result = await utils.apiCall<INewsListResponse>({
                method: "get",
                url: "/api/articles/news",
                params: {
                    skip: pageParam,
                    limit: pageParam === 0 ? NEWS_INITIAL_PAGE_SIZE : NEWS_LOAD_MORE_SIZE,
                },
            });
            if (!isPlainObject(result) || "error" in result || !Array.isArray(result.articles)) {
                throw new Error(
                    isPlainObject(result) && "error" in result && isString(result.error)
                        ? result.error
                        : "Failed to fetch news posts",
                );
            }

            // SAFETY: news list JSON has articles[] after rejecting error payloads.
            return result as INewsListResponse;
        },
        initialPageParam: 0,
        getNextPageParam: (lastPage, allPages) => {
            const loaded = allPages.reduce((count, page) => count + page.articles.length, 0);
            return loaded < lastPage.total ? loaded : undefined;
        },
    });
}

export function useAllNewsPosts() {
    return useQuery({
        queryKey: ["newsPosts", "all"],
        queryFn: () =>
            utils.apiCall<INewsListResponse>({
                method: "get",
                url: "/api/articles/news",
                params: { skip: 0, limit: 200 },
            }),
    });
}

export function useNewsPost(slug: string | null) {
    return useQuery({
        queryKey: ["newsPost", slug],
        queryFn: () =>
            utils.apiCall<IArticle>({
                method: "get",
                url: `/api/articles/news/${slug}`,
            }),
        enabled: Boolean(slug),
    });
}

export function useCreateNewsPost() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { title: string; content: string; pingNewsRole: boolean }) => {
            const response = await utils.apiCall({
                method: "post",
                url: "/api/articles/news/create",
                data,
            });
            return utils.handleMutationResponse(response);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["newsPosts"] });
        },
    });
}

export function useEditNewsPost(slug: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { title?: string; content?: string }) => {
            const response = await utils.apiCall({
                method: "put",
                url: `/api/articles/news/${slug}/edit`,
                data,
            });
            return utils.handleMutationResponse(response);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["newsPosts"] });
            queryClient.invalidateQueries({ queryKey: ["newsPost", slug] });
        },
    });
}
