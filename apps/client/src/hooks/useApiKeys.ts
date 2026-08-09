import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import utils from "@tc/utils/client";
import { ApiScope } from "@tc/types/ApiKey";
import { IUser } from "@tc/types/User";
import { IApiKey } from "@tc/types/ApiKey";

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
                url: "/api/keys",
            });
            return res?.apiKey ?? null;
        },
        staleTime: 60_000,
    });
}

export function useAllApiKeys() {
    return useQuery({
        queryKey: ["apiKey", "all"],
        queryFn: async () => {
            const res = await utils.apiCall<{ apiKeys: { user: IUser; apiKeys: IApiKey[] }[] }>({
                method: "get",
                url: "/api/keys/all",
            });
            return res?.apiKeys ?? [];
        },
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
            qc.invalidateQueries({ queryKey: ["apiKey", "all"] });
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
            qc.invalidateQueries({ queryKey: ["apiKey", "all"] });
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
            qc.invalidateQueries({ queryKey: ["apiKey", "all"] });
        },
    });
}

/** Admin only: revoke a specific API key by id */
export function useRevokeApiKeyAdmin() {
    const qc = useQueryClient();

    return useMutation({
        mutationKey: ["apiKey", "revokeAdmin"],
        mutationFn: async (keyId: string) => {
            const res = await utils.apiCall({
                method: "post",
                url: `/api/keys/revoke/${keyId}`,
            });
            return utils.handleMutationResponse(res);
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["apiKey", "meta"] });
            qc.invalidateQueries({ queryKey: ["apiKey", "all"] });
        },
    });
}
