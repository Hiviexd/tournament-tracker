import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useLoggedInUser from "../hooks/useLoggedInUser";
import { useAtom } from "jotai";
import { loggedInUserAtom, redirectAtom } from "../store/atoms";
import helpers from "../helpers";
import { notifications } from "@mantine/notifications";
import Loading from "../components/common/Loading";

interface IPropTypes {
    permissions?: string[];
    children: JSX.Element;
}

export default function ProtectedRoute({ permissions = [], children }: IPropTypes) {
    const { data: user, isLoading } = useLoggedInUser();
    const [loggedInUser, setLoggedInUser] = useAtom(loggedInUserAtom);
    const [redirect, setRedirect] = useAtom(redirectAtom);
    const navigate = useNavigate();
    const [authChecked, setAuthChecked] = useState(false);

    // Set user data
    useEffect(() => {
        if (!isLoading) {  // Changed this condition
            if (user) {
                setLoggedInUser(user);
            }
            setAuthChecked(true);
        }
    }, [user, isLoading, setLoggedInUser]);

    // Check permissions after user data is set
    useEffect(() => {
        if (authChecked && permissions.length > 0) {
            const hasPermissions = helpers.hasRequiredPermissions(loggedInUser, permissions);
            if (!hasPermissions) {
                notifications.show({
                    title: "Missing Permissions",
                    message: "You don't have the required permissions to view this page!",
                    color: "red",
                    autoClose: 3000,
                });
                setRedirect(true);
            }
        }
    }, [authChecked, loggedInUser, permissions, setRedirect]);

    // Handle redirect
    useEffect(() => {
        if (redirect) {
            setRedirect(false);
            navigate("/");
        }
    }, [redirect, setRedirect, navigate]);

    if (isLoading || !authChecked) {
        return <Loading />;
    }

    return children;
}
