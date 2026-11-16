import { Stack, Title, Text, Group, Box, Button, Skeleton, ScrollArea, SimpleGrid } from "@mantine/core";
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
// Room for the cards' hover lift (4px) and shadow, which the scroll viewport would otherwise clip.
const HOVER_GUTTER = 12;

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

        const rows = grid.querySelectorAll(".news-post-card");
        const last = rows[OLDER_NEWS_SCROLL_THRESHOLD - 1];
        if (!(last instanceof HTMLElement)) {
            setMaxHeight(undefined);
            return;
        }

        const bottom = last.getBoundingClientRect().bottom - grid.getBoundingClientRect().top;
        setMaxHeight(bottom + HOVER_GUTTER);
    }, [articles.length]);

    useLayoutEffect(() => {
        updateMaxHeight();
        window.addEventListener("resize", updateMaxHeight);
        return () => window.removeEventListener("resize", updateMaxHeight);
    }, [updateMaxHeight]);

    return (
        // The scroll viewport clips overflow, so pad it (and pull it back out with a negative margin)
        // to leave room for the cards' hover lift and shadow.
        <ScrollArea.Autosize mah={shouldScroll ? maxHeight : undefined} type="hover" m={-HOVER_GUTTER}>
            <Box ref={gridRef} p={HOVER_GUTTER}>
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
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
        <Stack gap="sm">
            <Skeleton height={170} radius="md" />
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                <Skeleton height={84} radius="md" />
                <Skeleton height={84} radius="md" />
            </SimpleGrid>
        </Stack>
    );
}

export default function HomeNewsSection() {
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
        <>
            {(isLoading || articles.length > 0) && (
                <Stack gap="md">
                    <Group justify="space-between" align="flex-end" wrap="wrap" gap="sm">
                        <Stack gap={4}>
                            <Title order={2} className="home-section-title header-border-left">
                                Latest News
                            </Title>
                            <Text size="sm" c="dimmed" className="home-section-subtitle">
                                Announcements from the Tournament Committee
                            </Text>
                        </Stack>
                        {user && !user.isSubscribedToNews && (
                            <Button
                                size="xs"
                                variant="light"
                                leftSection={<FontAwesomeIcon icon="bell" />}
                                onClick={handleSubscribe}
                                loading={updateNewsSubscription.isPending}>
                                Receive osu! notifications
                            </Button>
                        )}
                    </Group>
                    {isLoading ? (
                        <NewsCardsLoadingState />
                    ) : (
                        <>
                            {featured && <NewsPostCard article={featured} featured onSelect={handleSelect} />}
                            {rest.length > 0 && <OlderNewsList articles={rest} onSelect={handleSelect} />}
                            {hasNextPage && (
                                <Group justify="center">
                                    <Button
                                        variant="subtle"
                                        size="compact-sm"
                                        rightSection={<FontAwesomeIcon icon="chevron-down" />}
                                        onClick={() => fetchNextPage()}
                                        loading={isFetchingNextPage}>
                                        Show older posts
                                    </Button>
                                </Group>
                            )}
                        </>
                    )}
                </Stack>
            )}
            <NewsPostModal slug={newsSlug} onClose={handleModalClose} />
        </>
    );
}
