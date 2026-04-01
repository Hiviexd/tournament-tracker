import { useRef, useEffect, useState, useCallback } from "react";
import { Stack, Title, Text, Card, SimpleGrid, Group, Badge } from "@mantine/core";
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

/** Cursor influence radius; outside this, cards sit still. */
const FEATURE_REPEL_FALLOFF_PX = 480;
/** Base max shift (px); scales up slightly with card size for big tiles. */
const FEATURE_REPEL_MAX_PX = 1080;

export default function HomePage() {
    const [user] = useAtom(loggedInUserAtom);
    const { data: quote, isLoading: isQuoteLoading } = useRandomQuote();
    const pointerRef = useRef<{ x: number; y: number } | null>(null);
    const cardRefs = useRef<(HTMLElement | null)[]>([]);
    const [repelByIndex, setRepelByIndex] = useState<Record<number, { x: number; y: number }>>({});
    const [hoveredFeatureIndex, setHoveredFeatureIndex] = useState<number | null>(null);

    const computeFeatureRepel = useCallback(() => {
        const p = pointerRef.current;
        if (!p) {
            setRepelByIndex({});
            return;
        }
        const next: Record<number, { x: number; y: number }> = {};
        features.forEach((_, i) => {
            const el = cardRefs.current[i];
            if (!el) return;
            const rect = el.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const dx = cx - p.x;
            const dy = cy - p.y;
            const d = Math.hypot(dx, dy);
            if (d > FEATURE_REPEL_FALLOFF_PX) {
                next[i] = { x: 0, y: 0 };
                return;
            }
            // Stronger when close (comical); exponent < 1 keeps mid-range pushy too.
            const t = (1 - d / FEATURE_REPEL_FALLOFF_PX) ** 0.75;
            let nx: number;
            let ny: number;
            if (d > 0.5) {
                nx = dx / d;
                ny = dy / d;
            } else {
                // Cursor on the centroid: still shove so the card doesn't "stick"
                nx = 0;
                ny = -1;
            }
            const sizeBonus = Math.min(56, 0.28 * Math.min(rect.width, rect.height));
            const maxPush = Math.min(150, FEATURE_REPEL_MAX_PX + sizeBonus);
            next[i] = {
                x: nx * maxPush * t,
                y: ny * maxPush * t,
            };
        });
        setRepelByIndex(next);
    }, []);

    useEffect(() => {
        const onMove = (e: MouseEvent) => {
            pointerRef.current = { x: e.clientX, y: e.clientY };
            computeFeatureRepel();
        };
        const onScrollOrResize = () => computeFeatureRepel();
        const clearPointer = () => {
            pointerRef.current = null;
            setRepelByIndex({});
        };
        window.addEventListener("mousemove", onMove);
        window.addEventListener("scroll", onScrollOrResize, true);
        window.addEventListener("resize", onScrollOrResize);
        window.addEventListener("blur", clearPointer);
        return () => {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("scroll", onScrollOrResize, true);
            window.removeEventListener("resize", onScrollOrResize);
            window.removeEventListener("blur", clearPointer);
        };
    }, [computeFeatureRepel]);

    const handleUserSelect = (user: IUser) => {
        window.open(user.osuProfileUrl, "_blank");
    };

    const setFeatureCardRef = (index: number) => (el: HTMLElement | null) => {
        cardRefs.current[index] = el;
    };

    const renderFeatureCard = (feature: Feature, index: number) => {
        const repel = repelByIndex[index] ?? { x: 0, y: 0 };
        const hoverLift = !feature.disabled && hoveredFeatureIndex === index;
        const repelTransform = `translate3d(${repel.x}px, ${repel.y}px, 0)`;
        const transform = hoverLift ? `${repelTransform} translateY(-4px)` : repelTransform;

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
            ref: setFeatureCardRef(index),
            style: { transform, willChange: "transform" },
            onMouseEnter: () => setHoveredFeatureIndex(index),
            onMouseLeave: () => setHoveredFeatureIndex((current) => (current === index ? null : current)),
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
                {!isQuoteLoading && quote ? (
                    <Stack gap="0">
                        <Text size="sm" ta="center">
                            Here's some wisdom from one of them:
                        </Text>
                        <Text size="sm" c="dimmed" ta="center" maw={400} mx="auto">
                            {quote?.quote} — {quote?.author?.username}, {moment(quote?.createdAt).format("YYYY")}
                        </Text>
                    </Stack>
                ) : null}
                <CommitteeSection onSelect={handleUserSelect} />
            </Stack>
        </Stack>
    );
}
