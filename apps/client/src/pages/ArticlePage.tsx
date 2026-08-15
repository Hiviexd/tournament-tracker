import { useLayoutEffect, useRef, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import {
    Button,
    Card,
    Group,
    Modal,
    Stack,
    Title,
    Skeleton,
    Text,
    Tooltip,
    TextInput,
    ActionIcon,
    Grid,
    TableOfContents,
} from "@mantine/core";
import { useAtom } from "jotai";
import { loggedInUserAtom } from "../store/atoms";
import { useArticle, useEditArticle, useDeleteArticle } from "../hooks/useArticle";
import MarkdownText from "../components/common/MarkdownText";
import EmptyState from "../components/common/EmptyState";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import TextEditor from "../components/common/TextEditor";
import { clearAutoSavedValue } from "../hooks/useAutoSave";
import { useDocumentTitle } from "@mantine/hooks";
import DateBadge from "../components/common/badges/DateBadge";
import UserLink from "../components/common/UserLink";
import { useConfirmModal } from "../hooks/useModals";

const PREDEFINED_ARTICLE_SLUGS = {
    "/resources/official": "official-resources",
    "/resources/community": "community-resources",
} as const satisfies Record<string, string>;

function hasMarkdownHeadings(content?: string) {
    if (!content) {
        return false;
    }

    const lines = content.split("\n");
    let inCodeBlock = false;

    for (const line of lines) {
        const trimmed = line.trim();

        if (trimmed.startsWith("```")) {
            inCodeBlock = !inCodeBlock;
            continue;
        }

        if (!inCodeBlock && /^#{1,6}\s+/.test(trimmed)) {
            return true;
        }
    }

    return false;
}

function ArticleLoadingState() {
    return (
        <Stack gap="lg">
            <Grid gap="lg" align="flex-start">
                <Grid.Col span={{ base: 12, md: 3 }} visibleFrom="md">
                    <Card shadow="sm" p="md">
                        <Stack gap="xs">
                            <Skeleton height={14} width="72%" />
                            <Skeleton height={20} />
                            <Skeleton height={20} width="92%" />
                            <Skeleton height={20} width="84%" />
                            <Skeleton height={20} width="76%" />
                            <Skeleton height={20} width="68%" />
                        </Stack>
                    </Card>
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 9 }}>
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
                </Grid.Col>
            </Grid>
        </Stack>
    );
}

export default function ArticlePage() {
    const { slug } = useParams<{ slug: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const [user] = useAtom(loggedInUserAtom);

    const articleSlug = PREDEFINED_ARTICLE_SLUGS[location.pathname] || slug;

    const { data: article, isLoading, isError } = useArticle(articleSlug!);
    const { mutate: editArticle, isPending: isEditing } = useEditArticle(articleSlug!);
    const deleteArticleMutation = useDeleteArticle(articleSlug!);
    const confirmModal = useConfirmModal();

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editTitle, setEditTitle] = useState("");
    const [editContent, setEditContent] = useState("");
    const reinitializeTocRef = useRef<() => void>(() => {});

    useDocumentTitle(article?.title ? `${article.title} | Article` : "Article | Tournament Tracker");

    // disable the title if the article is in the predefined slugs
    const isPredefined = Object.keys(PREDEFINED_ARTICLE_SLUGS).includes(location.pathname);
    const showToc = article ? hasMarkdownHeadings(article.content) : false;

    useLayoutEffect(() => {
        if (article?.content) {
            reinitializeTocRef.current();
        }
    }, [article?.content]);

    if (isLoading) {
        return <ArticleLoadingState />;
    }

    if (isError || !article || article.error) {
        return (
            <EmptyState
                icon="file-alt"
                title={isError ? "Error loading article" : "Article not found"}
                description={isError ? "Try refreshing the page" : "The article you're looking for doesn't exist"}
            />
        );
    }

    const handleEdit = () => {
        setEditTitle(article.title);
        setEditContent(article.content);
        setIsEditModalOpen(true);
    };

    const handleSave = () => {
        type ArticleEditPayload = { title?: string; content?: string };
        const data: ArticleEditPayload = {};

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
                        (key) => PREDEFINED_ARTICLE_SLUGS[key] === articleSlug,
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
        const confirm = await confirmModal({
            preset: "delete",
            title: "Delete Article?",
            text: "Are you sure you want to delete this article? This action is irreversible.",
        });
        if (!confirm) return;

        await deleteArticleMutation.mutateAsync();
    };

    return (
        <Stack gap="lg">
            {!isPredefined && (
                <Stack gap="xs">
                    <Group align="center">
                        <Title order={2} className="header-border-left">
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
                        <Group gap="5">
                            <Text size="xs" c="dimmed">
                                Last edited{" "}
                                {article.lastEditor && (
                                    <>
                                        by <UserLink user={article.lastEditor} />
                                    </>
                                )}
                            </Text>
                            <DateBadge date={article.updatedAt} size="sm" staticColor />
                        </Group>
                    )}
                </Stack>
            )}
            {isPredefined && user?.isCommittee && (
                <Group justify="flex-end" align="center">
                    <Group gap="xs">
                        <Text size="xs" c="dimmed">
                            Last edited{" "}
                            {article.lastEditor && (
                                <>
                                    by <UserLink user={article.lastEditor} />
                                </>
                            )}
                        </Text>
                        <DateBadge date={article.updatedAt} size="sm" staticColor />
                    </Group>
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

            <Grid gap="lg" align="flex-start">
                {showToc && (
                    <Grid.Col
                        span={{ base: 12, md: 3 }}
                        visibleFrom="md"
                        style={{ position: "sticky", top: "88px", alignSelf: "flex-start" }}>
                        <Card
                            shadow="sm"
                            p="md"
                            className="article-toc-scroll"
                            style={{ maxHeight: "calc(100vh - 104px)", overflowY: "auto" }}>
                            <Text size="sm" fw={600} mb="xs">
                                Table of contents
                            </Text>
                            <TableOfContents
                                variant="light"
                                size="sm"
                                minDepthToOffset={1}
                                depthOffset={18}
                                reinitializeRef={reinitializeTocRef}
                                scrollSpyOptions={{
                                    selector: "#article-content :is(h1, h2, h3, h4, h5, h6)",
                                    offset: 88, // offset added to acocunt for the fixed header
                                }}
                                getControlProps={({ data }) => ({
                                    component: "a",
                                    href: `#${data.id}`,
                                    children: data.value,
                                    onClick: (event) => {
                                        event.preventDefault();
                                        data.getNode().scrollIntoView({
                                            behavior: "smooth",
                                            block: "start",
                                        });
                                    },
                                })}
                            />
                        </Card>
                    </Grid.Col>
                )}
                <Grid.Col span={{ base: 12, md: showToc ? 9 : 12 }}>
                    <Card shadow="sm" p="lg">
                        <div id="article-content">
                            <MarkdownText
                                content={article.content}
                                allowHtml={article.type === "documentation" && !article.isPublic}
                            />
                        </div>
                    </Card>
                </Grid.Col>
            </Grid>

            <Modal opened={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Article" size="xl">
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
    );
}
