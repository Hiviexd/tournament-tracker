import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import utils from "../../utils";
import { ApiScope } from "../../interfaces/ApiKey";

export interface IApiKeyMeta {
    id: string;
    name: string;
    scopes: string[];
    createdAt: string;
    lastUsedAt?: string | null;
    revokedAt?: string | null;
}

export interface IApiKeyCreateResponse {
    message: string;
    key: string;
    apiKey: IApiKeyMeta;
}

export function useApiKeyMeta() {
    return useQuery({
        queryKey: ["apiKey", "meta"],
        queryFn: async () => {
            const res = await utils.apiCall<{ apiKey: IApiKeyMeta | null }>({
                method: "get",
                url: "/api/keys/get",
            });
            return res?.apiKey ?? null;
        },
        staleTime: 60_000,
    });
}

export function useCreateApiKey() {
    const qc = useQueryClient();

    return useMutation({
        mutationKey: ["apiKey", "create"],
        mutationFn: async ({ name, scopes, isElevated }: { name: string; scopes: ApiScope[]; isElevated: boolean }) => {
            const res = await utils.apiCall<IApiKeyCreateResponse>({
                method: "post",
                url: "/api/keys/create",
                data: { name, scopes, isElevated },
            });
            return utils.handleMutationResponse<IApiKeyCreateResponse>(res);
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["apiKey", "meta"] });
        },
    });
}

export function useUpdateApiKey() {
    const qc = useQueryClient();

    return useMutation({
        mutationKey: ["apiKey", "update"],
        mutationFn: async ({ scopes }: { scopes: ApiScope[] }) => {
            const res = await utils.apiCall<{ apiKey: IApiKeyMeta }>({
                method: "put",
                url: "/api/keys/update",
                data: { scopes },
            });
            return utils.handleMutationResponse(res);
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["apiKey", "meta"] });
        },
    });
}

export function useRevokeApiKey() {
    const qc = useQueryClient();

    return useMutation({
        mutationKey: ["apiKey", "revoke"],
        mutationFn: async () => {
            const res = await utils.apiCall({
                method: "post",
                url: "/api/keys/revoke",
            });
            return utils.handleMutationResponse(res);
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["apiKey", "meta"] });
        },
    });
}
