import { Modal, Stack, Skeleton, Text, Group, Tooltip } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { useCallback, useEffect } from "react";
import dayjs from "@tc/utils/dayjs";
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
    const [opened, { open, close }] = useDisclosure(false);

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

    const showUpdated =
        article && !("error" in article) && dayjs(article.updatedAt).diff(dayjs(article.createdAt), "seconds") > 2;

    return (
        <Modal opened={opened} onClose={handleClose} size="xl" title="News from the Tournament Committee">
            {isLoading || !article || "error" in article ? (
                <NewsPostModalLoadingState />
            ) : (
                <Stack gap="md">
                    <Group gap="md">
                        <Tooltip label={dayjs(article.createdAt).format("LLL")}>
                            <Text size="sm" c="dimmed">
                                Posted {dayjs(article.createdAt).fromNow()}
                            </Text>
                        </Tooltip>
                        {showUpdated && (
                            <Tooltip label={dayjs(article.updatedAt).format("LLL")}>
                                <Text size="sm" c="dimmed">
                                    Updated {dayjs(article.updatedAt).fromNow()}
                                </Text>
                            </Tooltip>
                        )}
                    </Group>
                    <MarkdownText content={`# ${article.title}\n\n${article.content}`} allowHtml={false} />
                </Stack>
            )}
        </Modal>
    );
}
