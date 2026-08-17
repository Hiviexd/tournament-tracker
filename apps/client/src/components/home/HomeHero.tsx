import { Card, Stack, Title, Text, Group, Box, Image, SimpleGrid, Button, Skeleton, ScrollArea } from "@mantine/core";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAtom } from "jotai";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IArticle } from "@tc/types/Article";
import { loggedInUserAtom } from "../../store/atoms";
import { useNewsPosts } from "../../hooks/useNewsPosts";
import { useUpdateNewsSubscription } from "../../hooks/useUsers";
import { useConfirmModal } from "../../hooks/useModals";
import NewsPostCard from "./NewsPostCard";
import NewsPostModal from "./NewsPostModal";

const OLDER_NEWS_SCROLL_THRESHOLD = 6;

function OlderNewsList({ articles, onSelect }: { articles: IArticle[]; onSelect: (article: IArticle) => void }) {
    const gridRef = useRef<HTMLDivElement>(null);
    const [maxHeight, setMaxHeight] = useState<number | undefined>();
    const shouldScroll = articles.length > OLDER_NEWS_SCROLL_THRESHOLD;

    const updateMaxHeight = useCallback(() => {
        const grid = gridRef.current;
        if (!grid || articles.length <= OLDER_NEWS_SCROLL_THRESHOLD) {
            setMaxHeight(undefined);
            return;
        }

        const cards = grid.querySelectorAll(".news-post-card");
        const sixth = cards[OLDER_NEWS_SCROLL_THRESHOLD - 1];
        if (!(sixth instanceof HTMLElement)) {
            setMaxHeight(undefined);
            return;
        }

        setMaxHeight(sixth.offsetTop + sixth.offsetHeight);
    }, [articles.length]);

    useLayoutEffect(() => {
        updateMaxHeight();
        window.addEventListener("resize", updateMaxHeight);
        return () => window.removeEventListener("resize", updateMaxHeight);
    }, [updateMaxHeight]);

    return (
        <ScrollArea.Autosize mah={shouldScroll ? maxHeight : undefined} type="hover">
            <Box ref={gridRef}>
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                    {articles.map((article) => (
                        <NewsPostCard key={article.slug} article={article} onSelect={onSelect} />
                    ))}
                </SimpleGrid>
            </Box>
        </ScrollArea.Autosize>
    );
}

function NewsCardsLoadingState() {
    return (
        <Stack gap="md">
            <Skeleton height={140} radius="md" />
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                <Skeleton height={110} radius="md" />
                <Skeleton height={110} radius="md" />
            </SimpleGrid>
        </Stack>
    );
}

export default function HomeHero() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [user] = useAtom(loggedInUserAtom);
    const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useNewsPosts();
    const updateNewsSubscription = useUpdateNewsSubscription();
    const confirmModal = useConfirmModal();

    const articles = data?.pages.flatMap((page) => page.articles) ?? [];
    const [featured, ...rest] = articles;
    const newsSlug = searchParams.get("news");

    const handleSelect = (article: IArticle) => {
        setSearchParams({ news: article.slug });
    };

    const handleModalClose = () => {
        setSearchParams({});
    };

    const handleSubscribe = async () => {
        const confirmed = await confirmModal({
            title: "Receive osu! notifications?",
            text: "You'll get an osu! chat announcement whenever the Tournament Committee publishes a news post. You can opt out anytime in Settings.",
            confirmText: "Subscribe",
        });

        if (confirmed) {
            try {
                await updateNewsSubscription.mutateAsync(true);
            } catch (error) {
                console.error(error);
            }
        }
    };

    return (
        <Card padding="md" radius="md" className="home-hero" shadow="sm">
            <Box className="home-hero-glow" aria-hidden />
            <Stack gap="lg" className="home-hero-content">
                <Group justify="space-between" align="center" wrap="wrap" gap="sm" className="home-hero-header">
                    <Group gap="sm" wrap="nowrap">
                        <Image src="/assets/logo-main.svg?20260211" alt="" w={36} h={36} className="home-hero-logo" />
                        <Title order={2} className="home-hero-title">
                            Tournament Tracker
                        </Title>
                    </Group>
                    {user && !user.isSubscribedToNews && (
                        <Button
                            size="xs"
                            leftSection={<FontAwesomeIcon icon="bell" />}
                            onClick={handleSubscribe}
                            loading={updateNewsSubscription.isPending}>
                            Receive osu! notifications
                        </Button>
                    )}
                </Group>

                {isLoading ? (
                    <Stack gap="md">
                        <Text size="sm" c="dimmed">
                            news from the committee:
                        </Text>
                        <NewsCardsLoadingState />
                    </Stack>
                ) : (
                    articles.length > 0 && (
                        <Stack gap="md">
                            <Text size="sm" c="dimmed">
                                news from the committee:
                            </Text>
                            {featured && <NewsPostCard article={featured} featured onSelect={handleSelect} />}
                            {rest.length > 0 && (
                                <>
                                    <Text size="sm" c="dimmed">
                                        older news:
                                    </Text>
                                    <OlderNewsList articles={rest} onSelect={handleSelect} />
                                </>
                            )}
                            {hasNextPage && (
                                <Group justify="center">
                                    <Button
                                        variant="light"
                                        onClick={() => fetchNextPage()}
                                        loading={isFetchingNextPage}>
                                        Show more
                                    </Button>
                                </Group>
                            )}
                        </Stack>
                    )
                )}
            </Stack>
            <NewsPostModal slug={newsSlug} onClose={handleModalClose} />
        </Card>
    );
}
