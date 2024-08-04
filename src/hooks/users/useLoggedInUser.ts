import { useQuery } from "@tanstack/react-query";
import { getLoggedInUser } from "../../api/users";

export default function useLoggedInUser() {
    return useQuery({
        queryKey: ["loggedInUser"],
        queryFn: getLoggedInUser,
    });
}
