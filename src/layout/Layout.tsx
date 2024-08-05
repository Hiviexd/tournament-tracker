import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAtom } from "jotai";
import { loggedInUserAtom } from "../store/atoms";
import useLoggedInUser from "../hooks/users/useLoggedInUser";
import helpers from "../helpers";
import { IUser } from "@interfaces/User";
import { notifications } from "@mantine/notifications";
import { AppShell, Burger, Group, Button, Image } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import logo from "../assets/logo.svg";
import "../sass/Layout.scss";

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
    const [opened, { toggle }] = useDisclosure();
    const [redirect, setRedirect] = useState(false); // Add redirect state


    useEffect(() => {
        if (helpers.httpIsValid(user)) {
            setLoggedInUser(user);
        }
    }, [user, setLoggedInUser]);

    useEffect(() => {
        if (!isLoading && permissions.length && !hasRequiredPermissions(user, permissions)) {
            notifications.show({
                title: "Missing Permissions",
                message: "You don't have the required permissions to view this page.",
                color: "danger",
                autoClose: 3000,
            });
            setRedirect(true); // Set redirect state
        }
    }, [isLoading, user, permissions]);

    useEffect(() => {
        if (redirect) {
            setRedirect(false); // Reset redirect state after redirection
        }
    }, [redirect]);

    if (isLoading) return <p>Loading...</p>;
    else {
        // Redirect if user doesn't have the required perms
        if (redirect) {
            return <Navigate replace to="/" />;
        } else
            return (
                <AppShell
                    header={{ height: 60 }}
                    navbar={{
                        width: 300,
                        breakpoint: "sm",
                        collapsed: { desktop: true, mobile: !opened },
                    }}
                    padding={{ base: 10, sm: 15, lg: "xl" }}>
                    <AppShell.Header>
                        <Group h="100%" px="md">
                            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
                            <Group justify="space-between" style={{ flex: 1 }}>
                                <Image src={logo} alt="Logo" h={45} />
                                <Group ml="xl" gap={0} visibleFrom="sm">
                                    <Button>Home</Button>
                                    <Button>Blog</Button>
                                    <Button>Contacts</Button>
                                    <Button>Support</Button>
                                </Group>
                            </Group>
                        </Group>
                    </AppShell.Header>

                    <AppShell.Navbar py="md" px={4}>
                        <Button>Home</Button>
                        <Button>Blog</Button>
                        <Button>Contacts</Button>
                        <Button>Support</Button>
                    </AppShell.Navbar>

                    <AppShell.Main>
                        <div className="main-layout">{page}</div>
                    </AppShell.Main>
                </AppShell>
            );
    }
}
