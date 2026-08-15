import { Stack, NavLink, Collapse } from "@mantine/core";
import { useAtom } from "jotai";
import { loggedInUserAtom } from "../../../store/atoms";
import { routes } from "../../../base/header.config";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link, useLocation, useNavigate } from "react-router-dom";
import utils from "@tc/utils/client";
import { useState } from "react";
import { IRoute } from "../../../base/header.config";

interface IProps {
    onClose: () => void;
}

export default function MobileNavigation({ onClose }: IProps) {
    const [user] = useAtom(loggedInUserAtom);
    const location = useLocation();
    const navigate = useNavigate();
    const [expandedRoute, setExpandedRoute] = useState<string | null>(null);

    // Use same visible routes logic as Header component
    const visibleRoutes = routes
        .filter((route) => utils.hasRequiredPermissions(user, route.permissions))
        .map((route) => ({
            ...route,
            links: route.links?.filter((link) => utils.hasRequiredPermissions(user, link.permissions)),
        }));

    const isRouteActive = (route: IRoute) => {
        // Direct match
        if (location.pathname === route.link) return true;
        // Match any child route
        return route.links?.some((link) => location.pathname === link.link);
    };

    const handleRouteClick = (route: IRoute) => {
        if (route.links?.length) {
            // Toggle dropdown if route has children
            setExpandedRoute(expandedRoute === route.title ? null : route.title);
        } else if (route.link) {
            // Navigate if route has a direct link
            navigate(route.link);
            onClose();
        }
    };

    const handleSubLinkClick = () => {
        onClose(); // Close mobile menu when clicking any sublink
    };

    return (
        <Stack>
            {visibleRoutes.map((route) => (
                <Stack key={route.title} gap={0}>
                    <NavLink
                        label={route.title}
                        leftSection={route.icon && <FontAwesomeIcon icon={route.icon} />}
                        active={isRouteActive(route)}
                        onClick={() => handleRouteClick(route)}
                        rightSection={
                            route.links?.length ? (
                                <FontAwesomeIcon
                                    icon="caret-down"
                                    style={{
                                        transform: expandedRoute === route.title ? "rotate(180deg)" : "none",
                                        transition: "transform 200ms ease",
                                    }}
                                />
                            ) : null
                        }
                    />
                    {route.links?.length && (
                        <Collapse expanded={expandedRoute === route.title}>
                            <Stack gap={0} pl="md">
                                {route.links.map((link) => (
                                    <NavLink
                                        key={link.title}
                                        label={link.title}
                                        component={Link}
                                        to={link.link || "#"}
                                        leftSection={link.icon ? <FontAwesomeIcon icon={link.icon} /> : undefined}
                                        active={location.pathname === link.link}
                                        onClick={handleSubLinkClick}
                                        variant="subtle"
                                    />
                                ))}
                            </Stack>
                        </Collapse>
                    )}
                </Stack>
            ))}
        </Stack>
    );
}
