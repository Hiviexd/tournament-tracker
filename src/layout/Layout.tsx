import { Navigate } from "react-router-dom";
import { useRecoilValue } from "recoil";
import { loggedInUser, loggedInUserLoaded } from "../atoms/userAtoms";
import { IUser } from "@interfaces/User";

interface IPropTypes {
    permissions: string[];
    page: JSX.Element;
}

// Check if the user has the required permissions
function hasRequiredPermissions(user: IUser | null, permissions: string[]): boolean {
    if (!user) return false;
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
    const user: IUser | null = useRecoilValue(loggedInUser);
    const userLoaded: boolean = useRecoilValue(loggedInUserLoaded);

    // Continue if no user and no perms required
    if (user === null && !permissions.length) return page;

    // Redirect if no user or if user doesn't have the required perms
    if (userLoaded && (user === null || !hasRequiredPermissions(user, permissions))) {
        // TODO: emit a toast message
        console.log("missing permissions. redirecting...");
        return <Navigate replace to="/" />;
    }

    return <>{userLoaded && page}</>;
}
