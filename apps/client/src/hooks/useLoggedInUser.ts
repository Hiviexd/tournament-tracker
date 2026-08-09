import { useQuery } from "@tanstack/react-query";
import utils from "@tc/utils/client";

export default function useLoggedInUser() {
    return useQuery({
        queryKey: ["loggedInUser"],
        queryFn: () =>
            utils.apiCall({
                method: "get",
                url: "/api/users/me",
            }),
    });
}
