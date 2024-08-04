import { Navigate } from "react-router-dom";
import { useAtom } from "jotai";
import { loggedInUserAtom } from "../store/atoms";
import useLoggedInUser from "../hooks/users/useLoggedInUser";
import helpers from "../helpers";
import { IUser } from "@interfaces/User";

interface IPropTypes {
    permissions?: string[];
    page: JSX.Element;
}

// Check if the user has the required permissions
function hasRequiredPermissions(user: IUser | null, permissions: string[]): boolean {
    if (!permissions.length) return true;

    if (!user) return !permissions.length;

    if (user.isAdmin) return true;
    // if (user.isDev) return true;

    if (
        (permissions.includes("admin") && !user.isAdmin) ||
        (permissions.includes("committee") && !user.isCommittee) ||
        (permissions.includes("dev") && !user.isDev)
    )
        return false;
    return true;
}

export default function Layout({ permissions = [], page }: IPropTypes) {
    const { data: user, isLoading } = useLoggedInUser();
    const [, setLoggedInUser] = useAtom(loggedInUserAtom);

    if (isLoading) return <p>Loading...</p>;
    else {
        if (helpers.httpIsValid(user)) {
            setLoggedInUser(user);
        }

        // Redirect if user doesn't have the required perms
        if (permissions.length && !hasRequiredPermissions(user, permissions)) {
            // TODO: emit a toast message
            console.log("missing permissions. redirecting...");
            return <Navigate replace to="/" />;
        } else return page;
    }
}
