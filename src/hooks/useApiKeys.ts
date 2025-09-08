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
        mutationFn: async ({ name, scopes }: { name: string, scopes: ApiScope[] }) => {
            const res = await utils.apiCall<IApiKeyCreateResponse>({
                method: "post",
                url: "/api/keys/create",
                data: { name, scopes },
            });
            return res;
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
            await utils.apiCall({
                method: "post",
                url: "/api/keys/revoke",
            });
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["apiKey", "meta"] });
        },
    });
}
