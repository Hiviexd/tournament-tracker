import { AppShell, Container, Flex } from "@mantine/core";
import { useDisclosure, useDocumentTitle } from "@mantine/hooks";
import "../sass/Layout.scss";

// components
import Header from "../components/common/Header";
import MobileHeader from "../components/common/MobileHeader";

// fontawesome icons
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface IPropTypes {
    page: JSX.Element;
    title?: string;
    icon?: string;
}

export default function Layout({ page, title, icon = "trophy" }: IPropTypes) {
    const [opened, { toggle }] = useDisclosure();

    useDocumentTitle(
        title && title !== "Home" ? `${title} | Tournament Tracker` : "Tournament Tracker"
    );

    return (
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
                            <span>{title}</span>
                        </Flex>
                    </Container>
                    {
                        <Container p={20} fluid>
                            {page}
                        </Container>
                    }
                </div>
            </AppShell.Main>
        </AppShell>
    );
}
