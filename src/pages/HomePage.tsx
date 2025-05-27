import { Container, Stack, Title, Text, Card, SimpleGrid, Group, Badge } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { useAtom } from "jotai";
import { loggedInUserAtom } from "../store/atoms";
import LoginButton from "../components/common/buttons/LoginButton";
import CommitteeSection from "../components/users/CommitteeSection";
import { IUser } from "@interfaces/User";
import { Link } from "react-router-dom";
import { useRandomQuote } from "../hooks/useQuotes";
import moment from "moment";

interface Feature {
    icon: IconProp;
    title: string;
    description: string;
    link: string;
    disabled?: boolean;
    new?: boolean;
}

const features: Feature[] = [
    {
        icon: "trophy",
        title: "Official Support Status",
        description: "Track the official support status of ongoing tournaments",
        link: "/tournaments",
        // new: true,
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
        description: "Preview how badges, news banners, and in-game banners will look like in the osu! website/client",
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

export default function HomePage() {
    const [user] = useAtom(loggedInUserAtom);
    const { data: quote } = useRandomQuote();

    const handleUserSelect = (user: IUser) => {
        window.open(user.osuProfileUrl, "_blank");
    };

    const renderFeatureCard = (feature: Feature, index: number) => {
        const cardContent = (
            <>
                <Group mb="xs">
                    <FontAwesomeIcon
                        icon={feature.icon}
                        size="lg"
                        style={{ color: "var(--mantine-color-primary-6)" }}
                    />
                    <Title order={4}>{feature.title}</Title>
                    {feature.disabled && (
                        <Badge size="sm" variant="light">
                            Coming Soon
                        </Badge>
                    )}
                    {feature.new && (
                        <Badge size="sm" variant="light" className="animation-pulse">
                            New Feature!
                        </Badge>
                    )}
                </Group>
                <Text size="sm" c="dimmed">
                    {feature.description}
                </Text>
            </>
        );

        const cardProps = {
            padding: "lg",
            radius: "md",
            className: "feature-card",
            "data-disabled": feature.disabled,
        };

        if (feature.disabled) {
            return (
                <Card key={index} {...cardProps}>
                    {cardContent}
                </Card>
            );
        }

        return (
            <Card key={index} {...cardProps} component={Link} to={feature.link}>
                {cardContent}
            </Card>
        );
    };

    return (
        <Container size="lg">
            <Stack gap="xl" py="xl">
                {/* Hero Section */}
                <Stack ta="center" gap="md">
                    <Title order={1}>Tournament Tracker</Title>
                    <Text size="xl" c="dimmed" maw={600} mx="auto">
                        The one-stop shop for all official osu! tournament correspondence and information!
                    </Text>
                </Stack>

                {/* Features Grid */}
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
                    {features.map((feature, index) => renderFeatureCard(feature, index))}
                </SimpleGrid>

                {/* Login Section */}
                {!user && (
                    <Card padding="xl" radius="md">
                        <Stack align="center" gap="md">
                            <Title order={3}>Get Started</Title>
                            <Text c="dimmed" ta="center" maw={400}>
                                Sign in with your osu! account to access the platform's features
                            </Text>
                            <LoginButton size="lg" text="Sign in with osu!" />
                        </Stack>
                    </Card>
                )}

                {/* Committee Section */}
                <Stack gap="md">
                    <Title order={2} ta="center">
                        Meet the Committee
                    </Title>
                    <Text size="sm" ta="center">
                        Here's some wisdom from one of them:
                        <Text size="sm" c="dimmed" ta="center" maw={400} mx="auto">
                            {quote?.quote} — {quote?.author?.username}, {moment(quote?.createdAt).format("YYYY")}
                        </Text>
                    </Text>
                    <CommitteeSection onSelect={handleUserSelect} />
                </Stack>
            </Stack>
        </Container>
    );
}
