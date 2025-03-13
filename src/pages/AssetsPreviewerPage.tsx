import { Container, Tabs, Alert, Text, useMantineTheme } from "@mantine/core";
import { useSearchParams } from "react-router-dom";
import { useMediaQuery } from "@mantine/hooks";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";
import NewsBannersTab from "../components/previewer/NewsBannersTab";
import BadgesTab from "../components/previewer/BadgesTab";
import InGameBannersTab from "../components/previewer/InGameBannersTab";

export default function AssetPreviewerPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const defaultTab = searchParams.get("tab") || "badges";
    const theme = useMantineTheme();
    const isLargeScreen = useMediaQuery(`(min-width: ${theme.breakpoints.md})`);

    const handleTabChange = (value: string | null) => {
        if (value) {
            setSearchParams({ tab: value });
        }
    };

    if (!isLargeScreen) {
        return (
            <Container size="md" py="xl">
                <Alert color="danger" title="Screen too small" icon={<FontAwesomeIcon icon={faExclamationTriangle} />}>
                    <Text>
                        The Asset Previewer tool requires a larger screen width to function properly. Please use a
                        device with a larger screen (desktop or tablet in landscape mode) to access this feature.
                    </Text>
                    <br />
                    <Text>
                        This is due to the nature of the tool, which requires to preview things in very exact dimensions to
                        mirror the way things look on the osu! website.
                    </Text>
                </Alert>
            </Container>
        );
    }

    return (
        <Container size="xl">
            <Tabs defaultValue={defaultTab} onChange={handleTabChange}>
                <Tabs.List>
                    <Tabs.Tab value="badges">Badges</Tabs.Tab>
                    <Tabs.Tab value="news-banners">News Banners</Tabs.Tab>
                    <Tabs.Tab value="in-game-banners" disabled>
                        In-game Banners
                    </Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="badges">
                    <BadgesTab />
                </Tabs.Panel>

                <Tabs.Panel value="news-banners">
                    <NewsBannersTab />
                </Tabs.Panel>

                <Tabs.Panel value="in-game-banners">
                    <InGameBannersTab />
                </Tabs.Panel>
            </Tabs>
        </Container>
    );
}
