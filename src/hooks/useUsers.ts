import { useQuery } from "@tanstack/react-query";
import { searchUsers } from "../api/users";

export function useUsers(search: string, limit?: number) {
    return useQuery({
        queryKey: ["users", search],
        queryFn: () => searchUsers(search, limit),
        enabled: !!search,
    });
}
