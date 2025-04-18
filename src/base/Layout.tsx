import { AppShell, Container, Flex, Breadcrumbs } from "@mantine/core";
import { useDisclosure, useDocumentTitle } from "@mantine/hooks";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { DEFAULT_HUE } from "../constants";
import utils from "../../utils";
import { useState, useEffect } from "react";

// components
import Header from "../components/common/Header";
import MobileHeader from "../components/common/MobileHeader";
import Footer from "./Footer";
import ScrollToTopButton from "../components/common/ScrollToTopButton";

// fontawesome icons
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface IPropTypes {
    page: JSX.Element;
    title?: string;
    icon?: string;
    parent?: { title: string; path: string };
}

export default function Layout({ page, title, icon = "trophy", parent }: IPropTypes) {
    const [opened, { toggle }] = useDisclosure();

    useDocumentTitle(title && title !== "Home" ? `${title} | Tournament Tracker` : "Tournament Tracker");

    const getThemeColor = () => {
        const hue = parseInt(localStorage.getItem("hue") || DEFAULT_HUE, 10);
        const isGreyscale = localStorage.getItem("greyscale") === "true";

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
                <meta name="apple-mobile-web-app-capable" content="yes" />
            </Helmet>
            <AppShell
                header={{ height: 70 }}
                navbar={{
                    width: 300,
                    breakpoint: "sm",
                    collapsed: { desktop: true, mobile: !opened },
                }}
                padding={{ base: 10, sm: 15, lg: "xl" }}>
                <AppShell.Header>
                    <Header mobileHeaderOpened={opened} mobileHeaderToggle={toggle} />
                </AppShell.Header>

                <MobileHeader opened={opened} onClose={toggle} />

                <AppShell.Main>
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
                            <Container p={20} fluid>
                                {page}
                            </Container>
                        }
                    </div>
                    <Footer />
                </AppShell.Main>
                <ScrollToTopButton />
            </AppShell>
        </>
    );
}
