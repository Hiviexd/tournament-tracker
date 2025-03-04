import { useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { Button, Card, Group, Modal, Stack, Title, Container, Skeleton, Text } from "@mantine/core";
import { useAtom } from "jotai";
import { loggedInUserAtom } from "../store/atoms";
import { useArticle, useEditArticle, useDeleteArticle } from "../hooks/useArticle";
import MarkdownText from "../components/common/MarkdownText";
import EmptyState from "../components/common/EmptyState";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import moment from "moment";
import TextEditor from "../components/common/TextEditor";
import { clearAutoSavedValue } from "../hooks/useAutoSave";

const PREDEFINED_ARTICLE_SLUGS: Record<string, string> = {
    "/resources/official": "official-resources",
    "/resources/community": "community-resources",
};

export default function ArticlePage() {
    const { slug } = useParams<{ slug: string }>();
    const location = useLocation();
    const [user] = useAtom(loggedInUserAtom);

    const articleSlug = PREDEFINED_ARTICLE_SLUGS[location.pathname] || slug;

    const { data: article, isLoading, isError } = useArticle(articleSlug!);
    const { mutate: editArticle, isPending: isEditing } = useEditArticle(articleSlug!);
    const deleteArticleMutation = useDeleteArticle(articleSlug!);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editContent, setEditContent] = useState("");

    // disable the title if the article is in the predefined slugs
    const isPredefined = Object.keys(PREDEFINED_ARTICLE_SLUGS).includes(location.pathname);

    const LoadingState = () => (
        <Container size="lg">
            <Stack gap="lg">
                <Card shadow="sm" p="lg">
                    <Stack>
                        <Skeleton height={24} width="40%" />
                        <Skeleton height={16} />
                        <Skeleton height={16} />
                        <Skeleton height={16} width="80%" />
                        <Skeleton height={24} width="60%" mt="md" />
                        <Skeleton height={16} />
                        <Skeleton height={16} width="90%" />
                    </Stack>
                </Card>
            </Stack>
        </Container>
    );

    if (isLoading) {
        return <LoadingState />;
    }

    if (isError || !article || article.error) {
        return (
            <Container size="lg">
                <EmptyState
                    icon="file-alt"
                    title={isError ? "Error loading article" : "Article not found"}
                    description={isError ? "Try refreshing the page" : "The article you're looking for doesn't exist"}
                />
            </Container>
        );
    }

    const handleEdit = () => {
        setEditContent(article.content);
        setIsEditModalOpen(true);
    };

    const handleSave = () => {
        editArticle(editContent, {
            onSuccess: () => {
                setIsEditModalOpen(false);
            },
        });
    };

    const handleDelete = async () => {
        // confirm the deletion
        const confirm = window.confirm("Are you sure you want to delete this article? This action is irreversible.");
        if (!confirm) return;

        await deleteArticleMutation.mutateAsync();
    };

    return (
        <Container size="lg">
            <Stack gap="lg">
                <Group justify="flex-end" align="center">
                    {!isPredefined && (
                        <Title order={2} style={{ marginRight: "auto" }}>
                            {article.title}
                        </Title>
                    )}
                    {user?.isCommittee && (
                        <>
                            <Text fs="italic" size="xs" c="dimmed">
                                Last edited: {moment(article.updatedAt).format("YYYY-MM-DD, HH:mm:ss")}
                            </Text>
                            <Button bg="info" onClick={handleEdit} leftSection={<FontAwesomeIcon icon="edit" />}>
                                Edit
                            </Button>
                            {user?.isAdmin && (
                                <Button
                                    bg="danger"
                                    onClick={handleDelete}
                                    leftSection={<FontAwesomeIcon icon="trash" />}
                                    loading={deleteArticleMutation.isPending}>
                                    Delete
                                </Button>
                            )}
                        </>
                    )}
                </Group>

                <Card shadow="sm" p="lg">
                    <MarkdownText
                        content={article.content}
                        allowHtml={article.type === "documentation" && !article.isPublic}
                    />
                </Card>

                <Modal
                    opened={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    title="Edit Article"
                    size="xl">
                    <Stack gap="md">
                        <TextEditor
                            value={editContent}
                            onChange={setEditContent}
                            placeholder="Enter article content in Markdown..."
                            minHeight={300}
                            autoSaveKey={`edit-article-${article?._id}`}
                        />

                        <Group justify="flex-end">
                            <Button
                                variant="subtle"
                                onClick={() => {
                                    setIsEditModalOpen(false);
                                    // Clear autosaved content when canceling
                                    clearAutoSavedValue(`edit-article-${article?._id}`);
                                }}>
                                Cancel
                            </Button>
                            <Button onClick={handleSave} loading={isEditing}>
                                Save Changes
                            </Button>
                        </Group>
                    </Stack>
                </Modal>
            </Stack>
        </Container>
    );
}
