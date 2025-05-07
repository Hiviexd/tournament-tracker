import { useQuery } from "@tanstack/react-query";
import utils from "../../utils";

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
