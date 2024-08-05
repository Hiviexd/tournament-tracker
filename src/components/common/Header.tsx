// base
import { useNavigate } from "react-router-dom";
import helpers from "../../helpers";
import routes from "../../base/nav.routes";

// state
import { useAtom } from "jotai";
import { loggedInUserAtom } from "../../store/atoms";

// Mantine
import { AppShell, Burger, Button, Group, Image, Menu, Avatar } from "@mantine/core";

// icons
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import logo from "../../assets/logo-main.svg";
import osuLogo from "../../assets/logo-osu.svg";

interface IPropTypes {
    mobileHeaderOpened: boolean;
    mobileHeaderToggle: () => void;
}

export default function Header({ mobileHeaderOpened, mobileHeaderToggle }: IPropTypes) {
    const [user] = useAtom(loggedInUserAtom);
    const navigate = useNavigate();

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
                        <Image src={logo} alt="Logo" h={55} />
                        <Group ml="xl" gap={6} visibleFrom="sm">
                            {user ? (
                                routes.map(
                                    (route) =>
                                        helpers.hasRequiredPermissions(user, route.permissions) && (
                                            <Menu
                                                key={route.title}
                                                withArrow
                                                trigger="hover"
                                                shadow="md">
                                                <Menu.Target>
                                                    <Button
                                                        variant="subtle"
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
                                <a key="login" href="/api/auth/login">
                                    <Button
                                        variant="gradient"
                                        gradient={{ from: "primary.4", to: "primary.9", deg: 90 }}
                                        rightSection={<Image src={osuLogo} alt="osu!" h={20} />}>
                                        Login
                                    </Button>
                                </a>
                            )}
                            {user && (
                                <Menu withArrow trigger="hover" shadow="md">
                                    <Menu.Target>
                                        <Avatar size="lg" src={user.avatarUrl} />
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
                                        <a href="/api/auth/logout">
                                            <Menu.Item
                                                color="danger"
                                                leftSection={
                                                    <FontAwesomeIcon icon="sign-out-alt" />
                                                }>
                                                Logout
                                            </Menu.Item>
                                        </a>
                                    </Menu.Dropdown>
                                </Menu>
                            )}
                        </Group>
                    </div>
                </Group>
            </AppShell.Header>

            <AppShell.Navbar py="md" px={4}>
                <Button>aaaaaa</Button>
                <Button>Blog</Button>
                <Button>Contacts</Button>
                <Button>Support</Button>
            </AppShell.Navbar>
        </header>
    );
}
