import { Modal, Stack, Skeleton, Text, Group, Title, Divider } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { useCallback, useEffect, useRef } from "react";
import dayjs from "@tc/utils/dayjs";
import { IArticle } from "@tc/types/Article";
import { useNewsPost } from "../../hooks/useNewsPosts";
import MarkdownText from "../common/MarkdownText";
import NewsCategoryIcons from "../news/NewsCategoryIcons";
import DateBadge from "../common/badges/DateBadge";

interface IProps {
    slug: string | null;
    onClose: () => void;
}

function NewsPostModalLoadingState() {
    return (
        <Stack gap="md">
            <Skeleton height={18} width={160} />
            <Skeleton height={120} radius="sm" />
            <Skeleton height={80} radius="sm" />
        </Stack>
    );
}

export default function NewsPostModal({ slug, onClose }: IProps) {
    const { data: article, isLoading } = useNewsPost(slug);
    const lastArticleRef = useRef<IArticle | null>(null);
    const [opened, { open, close }] = useDisclosure(false);

    if (article && !("error" in article)) {
        lastArticleRef.current = article;
    }

    const displayedArticle = article && !("error" in article) ? article : lastArticleRef.current;

    const handleClose = useCallback(() => {
        onClose();
        close();
    }, [close, onClose]);

    useEffect(() => {
        if (slug) {
            open();
        } else {
            close();
        }
    }, [slug, open, close]);

    useEffect(() => {
        if (slug && !isLoading && (!article || "error" in article)) {
            notifications.show({
                title: "Error",
                message: "News post not found",
                color: "red",
            });
            handleClose();
        }
    }, [slug, isLoading, article, handleClose]);

    const showSkeleton = Boolean(slug) && (isLoading || !displayedArticle || displayedArticle.slug !== slug);
    const showUpdated =
        displayedArticle && dayjs(displayedArticle.updatedAt).diff(dayjs(displayedArticle.createdAt), "seconds") > 2;

    return (
        <Modal opened={opened} onClose={handleClose} size="xl" title="News from the Tournament Committee">
            {showSkeleton || !displayedArticle ? (
                <NewsPostModalLoadingState />
            ) : (
                <Stack gap="md">
                    <Title order={2}>
                        <NewsCategoryIcons categories={displayedArticle.categories} />
                        {displayedArticle.title}
                    </Title>
                    <Group gap="xs">
                        <Group gap={6}>
                            <Text size="xs" c="dimmed">
                                Posted
                            </Text>
                            <DateBadge date={displayedArticle.createdAt} size="xs" staticColor />
                        </Group>
                        {showUpdated && (
                            <>
                                <Divider orientation="vertical" />
                                <Group gap={6}>
                                    <Text size="xs" c="dimmed">
                                        Updated
                                    </Text>
                                    <DateBadge date={displayedArticle.updatedAt} size="xs" staticColor />
                                </Group>
                            </>
                        )}
                    </Group>
                    <Divider />
                    <MarkdownText content={displayedArticle.content} allowHtml={false} />
                </Stack>
            )}
        </Modal>
    );
}
