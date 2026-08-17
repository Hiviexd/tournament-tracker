import { Modal, Stack, Skeleton, Text, Group, Tooltip } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { useCallback, useEffect, useRef } from "react";
import dayjs from "@tc/utils/dayjs";
import { IArticle } from "@tc/types/Article";
import { useNewsPost } from "../../hooks/useNewsPosts";
import MarkdownText from "../common/MarkdownText";

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
                    <Group gap="md">
                        <Tooltip label={dayjs(displayedArticle.createdAt).format("LLL")}>
                            <Text size="sm" c="dimmed">
                                Posted {dayjs(displayedArticle.createdAt).fromNow()}
                            </Text>
                        </Tooltip>
                        {showUpdated && (
                            <Tooltip label={dayjs(displayedArticle.updatedAt).format("LLL")}>
                                <Text size="sm" c="dimmed">
                                    Updated {dayjs(displayedArticle.updatedAt).fromNow()}
                                </Text>
                            </Tooltip>
                        )}
                    </Group>
                    <MarkdownText
                        content={`# ${displayedArticle.title}\n\n${displayedArticle.content}`}
                        allowHtml={false}
                    />
                </Stack>
            )}
        </Modal>
    );
}
