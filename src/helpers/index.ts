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
    // No permissions required
    if (!permissions.length) return true;

    // No user, only allow if no permissions are required
    if (!user) return !permissions.length;

    // Admin bypass
    if (user.isAdmin) return true;

    // Check if user has the required permissions
    if (
        (permissions.includes("admin") && !user.isAdmin) ||
        (permissions.includes("committee") && !user.isCommittee)
    )
        return false;

    return true;
}

export default {
    httpIsValid,
    hasRequiredPermissions,
};
