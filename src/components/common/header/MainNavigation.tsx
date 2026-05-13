import { Menu, Button, Group } from "@mantine/core";
import { Link, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { routes } from "../../../base/header.config";
import utils from "../../../../utils";
import { IUser } from "../../../../interfaces/User";

interface IProps {
    user: IUser | null;
}

export default function MainNavigation({ user }: IProps) {
    const location = useLocation();

    const mainRoute = routes.find((route) => route.link === location.pathname);
    const parentByPrefix = routes.find((route) => route.link && location.pathname.startsWith(route.link));
    const parentByNestedLink = routes.find((route) => route.links?.some((link) => link.link === location.pathname));

    const selectedRoute = mainRoute
        ? mainRoute.title
        : parentByPrefix
          ? parentByPrefix.title
          : parentByNestedLink
            ? parentByNestedLink.title
            : null;

    const visibleRoutes = routes
        .filter((route) => utils.hasRequiredPermissions(user, route.permissions))
        .map((route) => ({
            ...route,
            links: route.links?.filter((link) => utils.hasRequiredPermissions(user, link.permissions)),
        }));

    return (
        <Group gap={6} visibleFrom="sm">
            {visibleRoutes.map((route) => (
                <Menu key={route.title} trigger="hover" shadow="md">
                    <Menu.Target>
                        <Button
                            variant={selectedRoute === route.title ? "light" : "subtle"}
                            rightSection={
                                route.links && route.links?.length > 0 ? <FontAwesomeIcon icon="caret-down" /> : null
                            }
                            component={route.link ? Link : undefined}
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
                                    leftSection={<FontAwesomeIcon icon={menuLink.icon as IconProp} />}>
                                    {menuLink.title}
                                </Menu.Item>
                            ))}
                        </Menu.Dropdown>
                    )}
                </Menu>
            ))}
        </Group>
    );
}
