import { Container, Tabs } from "@mantine/core";
import { useSearchParams } from "react-router-dom";
import NewsBannersTab from "../components/previewer/NewsBannersTab";
import BadgesTab from "../components/previewer/BadgesTab";
import InGameBannersTab from "../components/previewer/InGameBannersTab";

export default function AssetPreviewerPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const defaultTab = searchParams.get("tab") || "badges";

    const handleTabChange = (value: string | null) => {
        if (value) {
            setSearchParams({ tab: value });
        }
    };

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
