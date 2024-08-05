import { AppShell, Container, Flex } from "@mantine/core";
import { useDisclosure, useHeadroom } from "@mantine/hooks";
import "../sass/Layout.scss";

// components
import Header from "../components/common/Header";

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
    const pinned = useHeadroom({ fixedAt: 120 });

    return (
        <AppShell
            header={{ height: 80, collapsed: !pinned }}
            navbar={{
                width: 300,
                breakpoint: "sm",
                collapsed: { desktop: true, mobile: !opened },
            }}
            padding={{ base: 10, sm: 15, lg: "xl" }}>
            <AppShell.Header>
                <Header mobileHeaderOpened={opened} mobileHeaderToggle={toggle} />
            </AppShell.Header>

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
