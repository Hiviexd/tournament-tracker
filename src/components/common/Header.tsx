// base
import { useNavigate, Link } from "react-router-dom";
import helpers from "../../helpers";
import routes from "../../base/nav.routes";

// state
import { useAtom } from "jotai";
import { loggedInUserAtom } from "../../store/atoms";
import { useState } from "react";

// Mantine
import { AppShell, Burger, Button, Group, Image, Menu, Avatar } from "@mantine/core";

// icons
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";

interface IPropTypes {
    mobileHeaderOpened: boolean;
    mobileHeaderToggle: () => void;
}

export default function Header({ mobileHeaderOpened, mobileHeaderToggle }: IPropTypes) {
    const [user] = useAtom(loggedInUserAtom);
    const navigate = useNavigate();
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    const handleLogin = () => {
        setIsLoggingIn(true);
        window.location.href = "/api/auth/login";
    };

    const handleLogout = () => {
        window.location.href = "/api/auth/logout";
    };

    return (
        <header>
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
                                routes.map(
                                    (route) =>
                                        helpers.hasRequiredPermissions(user, route.permissions) && (
                                            <Menu key={route.title} trigger="hover" shadow="md">
                                                <Menu.Target>
                                                    <Button
                                                        variant="subtle"
                                                        component={Link}
                                                        to={route.href}
                                                        onClick={() => navigate(route.href)}>
                                                        {route.title}
                                                    </Button>
                                                </Menu.Target>
                                                {route.links && route.links.length > 0 && (
                                                    <Menu.Dropdown>
                                                        {route.links.map(
                                                            (link) =>
                                                                helpers.hasRequiredPermissions(
                                                                    user,
                                                                    link.permissions
                                                                ) && (
                                                                    <Menu.Item
                                                                        key={link.title}
                                                                        component={Link}
                                                                        to={route.href + link.to}
                                                                        leftSection={
                                                                            <FontAwesomeIcon
                                                                                icon={
                                                                                    link.icon as IconProp
                                                                                }
                                                                            />
                                                                        }
                                                                        onClick={() =>
                                                                            navigate(
                                                                                route.href + link.to
                                                                            )
                                                                        }>
                                                                        {link.title}
                                                                    </Menu.Item>
                                                                )
                                                        )}
                                                    </Menu.Dropdown>
                                                )}
                                            </Menu>
                                        )
                                )
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
                                            onClick={() => navigate("/users/" + user.osuId)}
                                            leftSection={<FontAwesomeIcon icon="user-circle" />}>
                                            Profile
                                        </Menu.Item>
                                        <Menu.Item
                                            onClick={() => navigate("/listing")}
                                            leftSection={<FontAwesomeIcon icon="trophy" />}>
                                            Your Tournaments
                                        </Menu.Item>
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
