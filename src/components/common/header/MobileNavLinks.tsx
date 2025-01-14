import { Stack, UnstyledButton, Group, Text, Collapse } from "@mantine/core";
import { useAtom } from "jotai";
import { loggedInUserAtom } from "../../../store/atoms";
import { routes } from "../../../base/header.config";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link, useLocation } from "react-router-dom";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import helpers from "../../../helpers";
import { useState } from "react";

export default function MobileNavLinks() {
    const [user] = useAtom(loggedInUserAtom);
    const location = useLocation();
    const [expandedRoute, setExpandedRoute] = useState<string | null>(null);

    const visibleRoutes = routes
        .filter((route) => helpers.hasRequiredPermissions(user, route.permissions))
        .map((route) => ({
            ...route,
            links: route.links?.filter((link) =>
                helpers.hasRequiredPermissions(user, link.permissions)
            ),
        }));

    const handleRouteClick = (routeTitle: string) => {
        setExpandedRoute(expandedRoute === routeTitle ? null : routeTitle);
    };

    return (
        <Stack>
            {visibleRoutes.map((route) => (
                <Stack key={route.title} gap={0}>
                    <UnstyledButton
                        onClick={() => handleRouteClick(route.title)}
                        component={route.link && !route.links?.length ? Link : "button"}
                        to={route.link}
                        p="xs"
                        style={{
                            backgroundColor:
                                location.pathname === route.link
                                    ? "var(--mantine-color-primary-9)"
                                    : undefined,
                        }}>
                        <Group justify="space-between">
                            <Text size="sm" fw={500}>
                                {route.title}
                            </Text>
                            {route.links?.length ? (
                                <FontAwesomeIcon
                                    icon="caret-down"
                                    style={{
                                        transform:
                                            expandedRoute === route.title
                                                ? "rotate(180deg)"
                                                : "none",
                                        transition: "transform 200ms ease",
                                    }}
                                />
                            ) : null}
                        </Group>
                    </UnstyledButton>

                    {route.links?.length ? (
                        <Collapse in={expandedRoute === route.title}>
                            <Stack gap={0} pl="md">
                                {route.links.map((link) => (
                                    <UnstyledButton
                                        key={link.title}
                                        component={Link}
                                        to={link.link || "#"}
                                        p="xs"
                                        style={{
                                            backgroundColor:
                                                location.pathname === link.link
                                                    ? "var(--mantine-color-primary-9)"
                                                    : undefined,
                                        }}>
                                        <Group>
                                            <FontAwesomeIcon icon={link.icon as IconProp} />
                                            <Text size="sm">{link.title}</Text>
                                        </Group>
                                    </UnstyledButton>
                                ))}
                            </Stack>
                        </Collapse>
                    ) : null}
                </Stack>
            ))}
        </Stack>
    );
}
