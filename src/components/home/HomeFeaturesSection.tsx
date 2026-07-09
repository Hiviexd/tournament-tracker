import { Stack, Title, Text, SimpleGrid } from "@mantine/core";
import HomeFeatureCard, { HomeFeature } from "./HomeFeatureCard";

const features: HomeFeature[] = [
    {
        icon: "trophy",
        title: "Official Support Status",
        description: "Track the official support status of ongoing tournaments",
        link: "/tournaments",
    },
    {
        icon: "poll-h",
        title: "Votes",
        description: "Access concluded committee votes that have been made public",
        link: "/votes",
    },
    {
        icon: "flag",
        title: "Tournament Reports",
        description: "Submit and view your tournament reports",
        link: "/reports/create",
    },
    {
        icon: "paper-plane",
        title: "Tickets",
        description: "Create and browse the collection of tickets created by users",
        link: "/tickets",
    },
    {
        icon: "images",
        title: "Assets Previewer",
        description: "Preview badges, news banners, and in-game banners in osu! website/client specs",
        link: "/assets-previewer",
    },
    {
        icon: "check-circle",
        title: "Mappool Compliance",
        description: "Verify if your mappool is compliant with the osu! content usage artist permissions",
        link: "/mappool-compliance",
    },
    {
        icon: "file-alt",
        title: "Official Resources",
        description: "Access the official resources for tournaments",
        link: "/resources/official",
    },
    {
        icon: "users",
        title: "Community Resources",
        description: "Browse a compendium of tournament resources created by the community",
        link: "/resources/community",
    },
];

export default function HomeFeaturesSection() {
    return (
        <Stack gap="md">
            <Stack gap={4} className="home-features-header">
                <Title order={2} className="home-section-title">
                    Explore
                </Title>
                <Text size="sm" c="dimmed" className="home-section-subtitle">
                    Tools and resources for tournament hosts, players, and the committee
                </Text>
            </Stack>
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" className="home-features">
                {features.map((feature, index) => (
                    <HomeFeatureCard key={feature.link} feature={feature} index={index} />
                ))}
            </SimpleGrid>
        </Stack>
    );
}
