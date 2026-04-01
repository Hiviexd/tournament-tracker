import { AppShell, Container, Flex, Breadcrumbs, Alert } from "@mantine/core";
import { useDisclosure, useDocumentTitle } from "@mantine/hooks";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { DEFAULT_HUE } from "../constants";
import utils from "../../utils";
import { useState, useEffect } from "react";
import { getSavedPreference } from "../hooks/useLocalPreferences";
import { getAccessibleColorScheme } from "../themes/accessibility/colors";

// components
import Header from "../components/common/Header";
import MobileNavbar from "../components/common/header/MobileNavbar";
import Footer from "../components/base/Footer";
import ScrollToTopButton from "../components/base/ScrollToTopButton";
import EnvironmentBanner from "../components/base/EnvironmentBanner";

// fontawesome icons
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";

interface IPropTypes {
    page: React.ReactNode;
    title?: string;
    icon?: string;
    parent?: { title: string; path: string };
}

export default function Layout({ page, title, icon = "trophy", parent }: IPropTypes) {
    const [opened, { toggle }] = useDisclosure();
    const envBannerPadding = import.meta.env.MODE !== "production" ? "3em" : "1em";

    useDocumentTitle(title && title !== "Home" ? `${title} | Tournament Tracker` : "Tournament Tracker");

    const getThemeColor = () => {
        const hue = getSavedPreference<number>("hue", Number(DEFAULT_HUE));
        const isGreyscale = getSavedPreference<boolean>("greyscale", false);
        const colorblindMode = getSavedPreference<"none" | "deuteranopia" | "protanopia" | "tritanopia">(
            "colorblindMode",
            "none",
        );

        // For colorblind modes, use the same colors as the actual themes
        if (colorblindMode !== "none") {
            const accessibleColors = getAccessibleColorScheme(colorblindMode);
            if (colorblindMode === "tritanopia") {
                return accessibleColors.pink[6]; // Use the same pink as the theme (index 6 is the base color)
            } else {
                return accessibleColors.blue[6]; // Use the same blue as the theme for deuteranopia/protanopia
            }
        }

        // For normal vision, use customizable hue/greyscale
        if (isGreyscale) {
            return "#656565";
        }
        return utils.hslToHex(hue, 0.9, 0.3);
    };

    const [themeColor, setThemeColor] = useState(getThemeColor());

    // Update theme color when localStorage changes
    useEffect(() => {
        const handleStorageChange = () => {
            setThemeColor(getThemeColor());
        };

        window.addEventListener("storage", handleStorageChange);
        return () => window.removeEventListener("storage", handleStorageChange);
    }, []);

    return (
        <>
            <Helmet>
                <meta name="theme-color" content={themeColor} />
                <meta name="apple-mobile-web-app-status-bar-style" content="default" />
                <meta name="mobile-web-app-capable" content="yes" />
            </Helmet>
            <AppShell
                header={{ height: 70 }}
                navbar={{
                    width: 300,
                    breakpoint: "sm",
                    collapsed: { desktop: true, mobile: !opened },
                }}
                padding={{ base: 10, sm: 15, lg: "xl" }}>
                <Header mobileHeaderOpened={opened} mobileHeaderToggle={toggle} />
                <MobileNavbar opened={opened} onClose={toggle} />

                <AppShell.Main style={{ paddingBottom: envBannerPadding }}>
                    <div className="main-layout">
                        <Container fluid className="page-header">
                            <Flex align="center" gap="md">
                                <FontAwesomeIcon icon={icon as IconProp} />
                                {title && (
                                    <Breadcrumbs>
                                        {parent && (
                                            <Link to={parent.path} className="breadcrumb-link">
                                                {parent.title}
                                            </Link>
                                        )}
                                        <span>{title}</span>
                                    </Breadcrumbs>
                                )}
                            </Flex>
                        </Container>
                        {
                            <Container className="layout-body" px={{ base: 10, sm: 20 }} py={20} fluid>
                                <Alert mb="md" title="Announcement" color="indigo" icon={<FontAwesomeIcon icon={faExclamationTriangle} />}>
                                    Blame Azer.
                                </Alert>
                                {page}
                            </Container>
                        }
                    </div>
                    <Footer />
                </AppShell.Main>
                <ScrollToTopButton style={{ paddingBottom: envBannerPadding }} />
            </AppShell>
            <EnvironmentBanner />
        </>
    );
}
