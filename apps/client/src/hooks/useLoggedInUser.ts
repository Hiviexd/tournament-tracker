import { useQuery } from "@tanstack/react-query";
import utils, { isNumber, isPlainObject } from "@tc/utils/client";

const UNAUTHORIZED_ATTEMPTS = 2;

type UnauthorizedError = { status: number };

function isUnauthorized<T>(value: T): value is T & UnauthorizedError {
    return isPlainObject(value) && "status" in value && isNumber(value.status) && value.status === 401;
}

export default function useLoggedInUser() {
    return useQuery({
        queryKey: ["loggedInUser"],
        queryFn: async () => {
            const result = await utils.apiCall({
                method: "get",
                url: "/api/users/me",
            });

            if (isUnauthorized(result)) {
                throw result;
            }

            return result;
        },
        retry: (failureCount, error) =>
            isUnauthorized(error) ? failureCount < UNAUTHORIZED_ATTEMPTS - 1 : failureCount < 3,
        retryDelay: (failureCount, error) => (isUnauthorized(error) ? 0 : Math.min(1000 * 2 ** failureCount, 30_000)),
        retryOnMount: false,
        refetchOnMount: (query) => !isUnauthorized(query.state.error),
        refetchOnWindowFocus: (query) => !isUnauthorized(query.state.error),
        refetchOnReconnect: (query) => !isUnauthorized(query.state.error),
    });
}
