import { useState } from "react";
import { Stack, Group, Button, Card, Text, Skeleton, Divider, Tooltip } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IArticle } from "@tc/types/Article";
import dayjs from "@tc/utils/dayjs";
import { useAllNewsPosts } from "../hooks/useNewsPosts";
import NewsPostCreateModal from "../components/news/NewsPostCreateModal";
import NewsPostEditModal from "../components/news/NewsPostEditModal";
import EmptyState from "../components/common/EmptyState";

function NewsLoadingState() {
    return (
        <Stack gap="md">
            {[1, 2, 3].map((i) => (
                <Card key={i} shadow="sm" p="md">
                    <Group justify="space-between">
                        <Skeleton height={20} width="40%" />
                        <Skeleton height={16} width={100} />
                    </Group>
                </Card>
            ))}
        </Stack>
    );
}

export default function NewsPage() {
    const { data, isLoading } = useAllNewsPosts();
    const articles = data && !("error" in data) ? data.articles : [];
    const [createOpened, { open: openCreate, close: closeCreate }] = useDisclosure(false);
    const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);
    const [selectedArticle, setSelectedArticle] = useState<IArticle | null>(null);

    const handleEdit = (article: IArticle) => {
        setSelectedArticle(article);
        openEdit();
    };

    const handleCloseEdit = () => {
        closeEdit();
        setSelectedArticle(null);
    };

    return (
        <Stack gap="lg">
            <Group justify="space-between" align="center">
                <Button
                    onClick={openCreate}
                    leftSection={<FontAwesomeIcon icon="plus" />}
                    variant="filled"
                    color="primary"
                    fullWidth>
                    Create News Post
                </Button>
            </Group>

            <Divider />

            {isLoading ? (
                <NewsLoadingState />
            ) : articles.length === 0 ? (
                <EmptyState
                    icon="newspaper"
                    title="No news posts"
                    description="Create the first news post to get started"
                />
            ) : (
                <Stack gap="sm">
                    {articles.map((article) => (
                        <Card
                            key={article.slug}
                            shadow="sm"
                            p="md"
                            onClick={() => handleEdit(article)}
                            style={{ cursor: "pointer" }}>
                            <Group justify="space-between" align="flex-start" wrap="nowrap">
                                <Text fw={500}>{article.title}</Text>
                                <Tooltip label={dayjs(article.createdAt).format("LLL")}>
                                    <Text size="sm" c="dimmed" style={{ flexShrink: 0 }}>
                                        {dayjs(article.createdAt).fromNow()}
                                    </Text>
                                </Tooltip>
                            </Group>
                        </Card>
                    ))}
                </Stack>
            )}

            <NewsPostCreateModal opened={createOpened} onClose={closeCreate} />
            <NewsPostEditModal opened={editOpened} onClose={handleCloseEdit} article={selectedArticle} />
        </Stack>
    );
}
