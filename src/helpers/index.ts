import { IUser } from "@interfaces/User";

/**
 * Check if a http request is valid (doesn't contain an error)
 */
function httpIsValid(response) {
    return response && response.error === undefined;
}

/**
 * Check if the user has the required permissions to view a component
 * @param user The user object
 * @param permissions Array of permissions required to view the component
 */
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

export default {
    httpIsValid,
    hasRequiredPermissions,
};
