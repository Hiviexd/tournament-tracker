import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import { useAtom } from "jotai";
import { loggedInUserAtom } from "../store/atoms";
import useLoggedInUser from "../hooks/useLoggedInUser";
import routes from "./routes.config";
import Layout from "./Layout";
import Loading from "../components/common/Loading";
import helpers from "../helpers";

export default function AuthRouter() {
    const { data: user, isLoading } = useLoggedInUser();
    const [loggedInUser, setLoggedInUser] = useAtom(loggedInUserAtom);
    const [authChecked, setAuthChecked] = useState(false);

    // Handle initial auth check
    useEffect(() => {
        if (!isLoading) {
            if (user) {
                setLoggedInUser(user);
            } else {
                setLoggedInUser(null);
            }
            setAuthChecked(true);
        }
    }, [user, isLoading, setLoggedInUser]);

    // Show loading state until both conditions are met:
    // 1. Initial API call is complete (isLoading === false)
    // 2. We've processed the auth result (authChecked === true)
    if (isLoading || !authChecked) {
        return <Loading />;
    }

    // Filter routes based on user permissions
    const authorizedRoutes = routes.filter(
        (route) => !route.permissions?.length || helpers.hasRequiredPermissions(loggedInUser, route.permissions)
    );

    return (
        <Routes>
            {authorizedRoutes.map((route) => (
                <Route
                    key={route.path}
                    path={route.path}
                    element={<Layout title={route.title} icon={route.icon} page={route.page} />}
                />
            ))}
        </Routes>
    );
}
