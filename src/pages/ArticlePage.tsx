import { useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import {
    Button,
    Card,
    Group,
    Modal,
    Stack,
    Title,
    Container,
    Skeleton,
    Text,
    Tooltip,
    TextInput,
    ActionIcon,
} from "@mantine/core";
import { useAtom } from "jotai";
import { loggedInUserAtom } from "../store/atoms";
import { useArticle, useEditArticle, useDeleteArticle } from "../hooks/useArticle";
import MarkdownText from "../components/common/MarkdownText";
import EmptyState from "../components/common/EmptyState";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import moment from "moment";
import TextEditor from "../components/common/TextEditor";
import { clearAutoSavedValue } from "../hooks/useAutoSave";
import { useDocumentTitle } from "@mantine/hooks";
import DateBadge from "../components/common/badges/DateBadge";
import UserLink from "../components/common/UserLink";

const PREDEFINED_ARTICLE_SLUGS: Record<string, string> = {
    "/resources/official": "official-resources",
    "/resources/community": "community-resources",
};

export default function ArticlePage() {
    const { slug } = useParams<{ slug: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const [user] = useAtom(loggedInUserAtom);

    const articleSlug = PREDEFINED_ARTICLE_SLUGS[location.pathname] || slug;

    const { data: article, isLoading, isError } = useArticle(articleSlug!);
    const { mutate: editArticle, isPending: isEditing } = useEditArticle(articleSlug!);
    const deleteArticleMutation = useDeleteArticle(articleSlug!);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editTitle, setEditTitle] = useState("");
    const [editContent, setEditContent] = useState("");

    useDocumentTitle(article?.title ? `${article.title} | Article` : "Article | Tournament Tracker");

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
        setEditTitle(article.title);
        setEditContent(article.content);
        setIsEditModalOpen(true);
    };

    const handleSave = () => {
        const data: { title?: string; content?: string } = {};

        if (editTitle !== article.title) {
            data.title = editTitle;
        }
        if (editContent !== article.content) {
            data.content = editContent;
        }

        editArticle(data, {
            onSuccess: (response: any) => {
                setIsEditModalOpen(false);

                // If title was changed, navigate to the new slug
                if (data.title && response?.article?.slug && response.article.slug !== articleSlug) {
                    // Handle predefined slugs
                    const predefinedPath = Object.keys(PREDEFINED_ARTICLE_SLUGS).find(
                        (key) => PREDEFINED_ARTICLE_SLUGS[key] === articleSlug
                    );

                    if (predefinedPath) {
                        // For predefined articles, just refresh the current page
                        window.location.reload();
                    } else {
                        // For regular articles, navigate to the new slug
                        navigate(`/${article.isDocumentation ? "docs" : "articles"}/${response.article.slug}`, {
                            replace: true,
                        });
                    }
                }
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
                {!isPredefined && (
                    <Stack gap="xs">
                        <Group align="center">
                            <Title order={2}>
                                {article.title}
                            </Title>
                            {user?.isCommittee && (
                                <Group gap="xs">
                                    <Tooltip label="Edit article">
                                        <ActionIcon size="md" variant="subtle" color="blue" onClick={handleEdit}>
                                            <FontAwesomeIcon icon="edit" />
                                        </ActionIcon>
                                    </Tooltip>
                                    {user?.isAdmin && (
                                        <Tooltip label="Delete article">
                                            <ActionIcon
                                                size="md"
                                                variant="subtle"
                                                color="danger"
                                                onClick={handleDelete}
                                                loading={deleteArticleMutation.isPending}>
                                                <FontAwesomeIcon icon="trash" />
                                            </ActionIcon>
                                        </Tooltip>
                                    )}
                                </Group>
                            )}
                        </Group>
                        {user?.isCommittee && (
                            <Group gap="xs">
                                <Text size="xs" c="dimmed">
                                    Last edited by <UserLink user={article.lastEditor} />
                                </Text>
                                <DateBadge date={article.updatedAt} size="sm" staticColor />
                            </Group>
                        )}
                    </Stack>
                )}
                {isPredefined && user?.isCommittee && (
                    <Group justify="flex-end" align="center">
                        <Tooltip label={moment(article.updatedAt).format("LLL")}>
                            <Text fs="italic" size="xs" c="dimmed">
                                Last edited: {moment(article.updatedAt).fromNow()}
                            </Text>
                        </Tooltip>
                        <Tooltip label="Edit article">
                            <ActionIcon size="lg" variant="subtle" color="blue" onClick={handleEdit}>
                                <FontAwesomeIcon icon="edit" />
                            </ActionIcon>
                        </Tooltip>
                        {user?.isAdmin && (
                            <Tooltip label="Delete article">
                                <ActionIcon
                                    size="lg"
                                    variant="subtle"
                                    color="red"
                                    onClick={handleDelete}
                                    loading={deleteArticleMutation.isPending}>
                                    <FontAwesomeIcon icon="trash" />
                                </ActionIcon>
                            </Tooltip>
                        )}
                    </Group>
                )}

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
                        {!isPredefined && (
                            <TextInput
                                label="Title"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.currentTarget.value)}
                                placeholder="Enter article title..."
                            />
                        )}

                        <Stack gap="4">
                            <Text size="sm" fw={500} mb="0">
                                Content
                            </Text>

                            <TextEditor
                                value={editContent}
                                onChange={setEditContent}
                                placeholder="Enter article content..."
                                minHeight={300}
                                autoSaveKey={`edit-article-${article?._id}`}
                                allowHtml={article.type === "documentation" && !article.isPublic}
                            />
                        </Stack>

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
