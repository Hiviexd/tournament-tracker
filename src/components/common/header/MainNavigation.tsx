import { Menu, Button, Group } from "@mantine/core";
import { Link, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { useCallback, useState, useEffect } from "react";
import { routes } from "../../../base/header.config";
import helpers from "../../../helpers";
import { IUser } from "../../../../interfaces/User";

interface IProps {
    user: IUser;
}

export default function MainNavigation({ user }: IProps) {
    const location = useLocation();

    const getSelectedRoute = useCallback(() => {
        const mainRoute = routes.find((route) => route.link === location.pathname);
        if (mainRoute) return mainRoute.title;

        const parentByPrefix = routes.find(
            (route) => route.link && location.pathname.startsWith(route.link)
        );
        if (parentByPrefix) return parentByPrefix.title;

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

    const visibleRoutes = routes
        .filter((route) => helpers.hasRequiredPermissions(user, route.permissions))
        .map((route) => ({
            ...route,
            links: route.links?.filter((link) =>
                helpers.hasRequiredPermissions(user, link.permissions)
            ),
        }));

    return (
        <Group gap={6} visibleFrom="sm">
            {visibleRoutes.map((route) => (
                <Menu key={route.title} trigger="hover" shadow="md">
                    <Menu.Target>
                        <Button
                            variant={selectedRoute === route.title ? "light" : "subtle"}
                            rightSection={
                                route.links && route.links?.length > 0 ? (
                                    <FontAwesomeIcon icon="caret-down" />
                                ) : null
                            }
                            component={route.link ? Link : "button"}
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
                                        <FontAwesomeIcon icon={menuLink.icon as IconProp} />
                                    }>
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
