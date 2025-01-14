// base
import { useEffect, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import helpers from "../../helpers";
import { routes } from "../../base/header.config";

// state
import { useAtom } from "jotai";
import { loggedInUserAtom } from "../../store/atoms";
import { useState } from "react";

// Mantine
import { AppShell, Burger, Button, Group, Image, Menu, Avatar } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";

// icons
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";

// components
import ThemeCustomizeModal from "./ThemeCustomizeModal";
import SettingsModal from "./SettingsModal";

interface IPropTypes {
    mobileHeaderOpened: boolean;
    mobileHeaderToggle: () => void;
}

export default function Header({ mobileHeaderOpened, mobileHeaderToggle }: IPropTypes) {
    const [user] = useAtom(loggedInUserAtom);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [customizeOpened, { open: openCustomize, close: closeCustomize }] = useDisclosure(false);
    const [settingsOpened, { open: openSettings, close: closeSettings }] = useDisclosure(false);
    const location = useLocation();

    const getSelectedRoute = useCallback(() => {
        // First check exact path matches
        const mainRoute = routes.find((route) => route.link === location.pathname);
        if (mainRoute) return mainRoute.title;

        // Then check if current path starts with any main route's link
        const parentByPrefix = routes.find(
            (route) => route.link && location.pathname.startsWith(route.link)
        );
        if (parentByPrefix) return parentByPrefix.title;

        // Finally check nested links
        const parentByNestedLink = routes.find((route) =>
            route.links?.some((link) => link.link === location.pathname)
        );
        if (parentByNestedLink) return parentByNestedLink.title;

        return null;
    }, [location.pathname]);

    const [selectedRoute, setSelectedRoute] = useState<string | null>(getSelectedRoute());

    useEffect(() => {
        setSelectedRoute(getSelectedRoute());
    }, [getSelectedRoute]);

    const handleLogin = () => {
        setIsLoggingIn(true);
        window.location.href = "/api/auth/login";
    };

    const handleLogout = () => {
        window.location.href = "/api/auth/logout";
    };

    const visibleRoutes = routes
        .filter((route) => helpers.hasRequiredPermissions(user, route.permissions))
        .map((route) => ({
            ...route,
            links: route.links?.filter((link) =>
                helpers.hasRequiredPermissions(user, link.permissions)
            ),
        }));

    return (
        <header>
            <ThemeCustomizeModal opened={customizeOpened} onClose={closeCustomize} />
            <SettingsModal opened={settingsOpened} onClose={closeSettings} />
            <AppShell.Header>
                <Group h="100%" px="xl">
                    <div className="nav-group">
                        <Burger
                            opened={mobileHeaderOpened}
                            onClick={mobileHeaderToggle}
                            hiddenFrom="sm"
                            size="sm"
                        />
                        <Image src="/assets/logo-main.svg" alt="Logo" h={55} />
                        <Group ml="xl" gap={6} visibleFrom="sm">
                            {user ? (
                                visibleRoutes.map((route) => (
                                    <Menu key={route.title} trigger="hover" shadow="md">
                                        <Menu.Target>
                                            <Button
                                                variant={
                                                    selectedRoute === route.title
                                                        ? "light"
                                                        : "subtle"
                                                }
                                                rightSection={
                                                    route.links && route.links?.length > 0 ? (
                                                        <FontAwesomeIcon icon="caret-down" />
                                                    ) : null
                                                }
                                                component={route.link ? Link : "button" as any}
                                                to={route.link || "#"}>
                                                {route.title}
                                            </Button>
                                        </Menu.Target>
                                        {route.links && route.links?.length > 0 && (
                                            <Menu.Dropdown>
                                                {route.links.map((menuLink) => (
                                                    <Menu.Item
                                                        key={menuLink.title}
                                                        component={Link}
                                                        to={menuLink.link || "#"}
                                                        leftSection={
                                                            <FontAwesomeIcon
                                                                icon={menuLink.icon as IconProp}
                                                            />
                                                        }>
                                                        {menuLink.title}
                                                    </Menu.Item>
                                                ))}
                                            </Menu.Dropdown>
                                        )}
                                    </Menu>
                                ))
                            ) : (
                                <Button
                                    onClick={handleLogin}
                                    variant="gradient"
                                    loading={isLoggingIn}
                                    gradient={{ from: "primary.9", to: "primary.4", deg: 45 }}
                                    leftSection={<Image src="/assets/logo-osu.svg" h={20} />}>
                                    Login
                                </Button>
                            )}
                            {user && (
                                <Menu withArrow shadow="md" trigger="hover">
                                    <Menu.Target>
                                        <Avatar
                                            src={user.avatarUrl}
                                            size="3rem"
                                            className="user-avatar"
                                            style={{ cursor: "pointer" }}
                                        />
                                    </Menu.Target>
                                    <Menu.Dropdown>
                                        <Menu.Label>Welcome back, {user.username}!</Menu.Label>
                                        <Menu.Item
                                            component={Link}
                                            to="/tournaments" // TODO: replace a query for user's tournaments
                                            leftSection={<FontAwesomeIcon icon="trophy" />}>
                                            Your Tournaments
                                        </Menu.Item>
                                        <Menu.Item
                                            onClick={openCustomize}
                                            leftSection={<FontAwesomeIcon icon="palette" />}>
                                            Customize Theme
                                        </Menu.Item>
                                        {user.isCommittee && (
                                            <Menu.Item
                                                onClick={openSettings}
                                                leftSection={<FontAwesomeIcon icon="cog" />}>
                                                Settings
                                            </Menu.Item>
                                        )}
                                        <Menu.Divider />
                                        <Menu.Item
                                            onClick={handleLogout}
                                            color="danger"
                                            leftSection={<FontAwesomeIcon icon="sign-out-alt" />}>
                                            Log Out
                                        </Menu.Item>
                                    </Menu.Dropdown>
                                </Menu>
                            )}
                        </Group>
                    </div>
                </Group>
            </AppShell.Header>

            {/* TODO mobile navbar */}
            <AppShell.Navbar py="md" px={4}>
                <Button>mobile</Button>
                <Button>navbar</Button>
                <Button>don't forget</Button>
                <Button>about this</Button>
            </AppShell.Navbar>
        </header>
    );
}
