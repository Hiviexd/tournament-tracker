import {
    Container,
    Tabs,
    Alert,
    Text,
    useMantineTheme,
    Skeleton,
    Group,
    Card,
    Paper,
    Stack,
    Center,
} from "@mantine/core";
import { useSearchParams } from "react-router-dom";
import { useMediaQuery } from "@mantine/hooks";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState } from "react";
import NewsBannersTab from "../components/previewer/NewsBannersTab";
import BadgesTab from "../components/previewer/BadgesTab";
import InGameBannersTab from "../components/previewer/InGameBannersTab";

export default function AssetPreviewerPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const defaultTab = searchParams.get("tab") || "badges";
    const theme = useMantineTheme();
    const isLargeScreen = useMediaQuery(`(min-width: ${theme.breakpoints.md})`);
    const [isMediaQueryReady, setIsMediaQueryReady] = useState(false);

    // Wait for media query to stabilize
    useEffect(() => {
        // Small delay to ensure media query is stable
        const timer = setTimeout(() => {
            setIsMediaQueryReady(true);
        }, 100);

        return () => clearTimeout(timer);
    }, []);

    const handleTabChange = (value: string | null) => {
        if (value) {
            setSearchParams({ tab: value });
        }
    };

    const BadgeTabSkeleton = () => {
        return (
            <>
                {/* Search section skeleton */}
                <Card withBorder my="xl">
                    <Group grow>
                        <div>
                            <Skeleton height={20} width="40%" mb="xs" />
                            <Skeleton height={36} width="100%" mb="sm" />
                            <Skeleton height={36} width="100%" />
                        </div>
                        <Paper p="md" style={{ border: "2px dashed #e9ecef" }}>
                            <Stack align="center" gap="xs">
                                <Skeleton height={16} width="80%" />
                                <Skeleton height={12} width="60%" />
                                <Skeleton height={12} width="70%" />
                            </Stack>
                        </Paper>
                    </Group>
                </Card>

                {/* Profile skeleton */}
                <div style={{ width: "100%", maxWidth: "1000px", margin: "0 auto" }}>
                    {/* Banner skeleton */}
                    <Skeleton height={250} width="100%" radius="6px 6px 0 0" />

                    {/* Profile info skeleton */}
                    <div
                        style={{
                            padding: "0 5%",
                            display: "flex",
                            alignItems: "center",
                            gap: "20px",
                            backgroundColor: "#46393f",
                            height: "95px",
                        }}>
                        <Skeleton height={120} width={120} radius={40} style={{ marginTop: "-40px" }} />
                        <div style={{ flex: 1 }}>
                            <Skeleton height={24} width="40%" mb="xs" />
                            <Skeleton height={16} width="30%" mb="xs" />
                            <Skeleton height={14} width="20%" />
                        </div>
                    </div>

                    {/* Badges skeleton */}
                    <div
                        style={{
                            padding: "10px 5%",
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "10px",
                            backgroundColor: "#382e32",
                            borderRadius: "0 0 6px 6px",
                        }}>
                        {Array(8)
                            .fill(0)
                            .map((_, i) => (
                                <Skeleton key={i} height={40} width={86} />
                            ))}
                    </div>
                </div>
            </>
        );
    };

    const NewsBannersTabSkeleton = () => {
        return (
            <>
                {/* News banners skeleton */}
                <Paper p="xl" mb="xl" style={{ border: "2px dashed #e9ecef" }}>
                    <Stack align="center" gap="sm">
                        <Skeleton height={20} width="60%" />
                        <Skeleton height={16} width="80%" />
                        <Skeleton height={16} width="40%" />
                    </Stack>
                </Paper>

                {/* News posts skeletons */}
                <Stack gap="xl" align="center">
                    <Skeleton height={130} width={530} mb="sm" />
                    <Skeleton height={160} width={670} mb="sm" />
                    <Skeleton height={160} width={320} mb="sm" />
                    <Skeleton height={160} width="100%" style={{ maxWidth: 1000 }} mb="sm" />
                    <Skeleton height={200} width={670} />
                </Stack>
            </>
        );
    };

    const InGameBannersTabSkeleton = () => {
        return (
            <>
                {/* In-game banners skeleton */}
                <Card withBorder mb="xl">
                    <Group grow>
                        <Skeleton height={120} />
                        <Skeleton height={120} />
                    </Group>
                    <Center mt="md">
                        <Skeleton height={30} width={120} />
                    </Center>
                </Card>

                <Skeleton height={240} width="100%" mb="sm" />
                <Skeleton height={16} width="50%" style={{ margin: "0 auto" }} />
            </>
        );
    };

    const LoadingState = () => {
        return (
            <Container size="xl">
                {/* Tabs skeleton */}
                <Skeleton height={40} width="100%" mb="md" />

                {/* Content skeleton based on default tab */}
                {defaultTab === "badges" ? (
                    <BadgeTabSkeleton />
                ) : defaultTab === "news-banners" ? (
                    <NewsBannersTabSkeleton />
                ) : (
                    <InGameBannersTabSkeleton />
                )}
            </Container>
        );
    };

    // Show skeleton while media query is initializing
    if (!isMediaQueryReady) {
        return <LoadingState />;
    }

    return (
        <Container size="xl">
            <Tabs defaultValue={defaultTab} onChange={handleTabChange}>
                <Tabs.List>
                    <Tabs.Tab value="badges">Badges</Tabs.Tab>
                    <Tabs.Tab value="news-banners">News Banners</Tabs.Tab>
                    <Tabs.Tab value="in-game-banners">In-game Banners</Tabs.Tab>
                </Tabs.List>

                {!isLargeScreen && (
                    <Alert
                        color="yellow"
                        title="Small screen detected"
                        icon={<FontAwesomeIcon icon={faExclamationTriangle} />}
                        mt="md">
                        <Text size="sm">
                            This tool is optimized for larger screens. Some elements may not display correctly on your
                            current device. For the best experience, consider using a device with a larger screen.
                        </Text>
                        <br />
                        <Text size="sm">
                            This is due to the nature of the tool, which requires to display things in very exact
                            dimensions to mirror the way things would look in the osu! website/client.
                        </Text>
                    </Alert>
                )}

                <Tabs.Panel value="badges">
                    <BadgesTab skeleton={<BadgeTabSkeleton />} />
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
