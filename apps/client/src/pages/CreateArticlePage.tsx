import { useState } from "react";
import { Card, Stack, TextInput, Switch, Select, Button, Group, Alert, Title, Divider, Box } from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { useCreateArticle } from "../hooks/useArticle";
import MarkdownText from "../components/common/MarkdownText";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ArticleType, ARTICLE_TYPES } from "@tc/types/Article";
import { pickStringUnion } from "@tc/utils/client";
import TextEditor from "../components/common/TextEditor";
import TextLengthIndicator from "../components/common/TextLengthIndicator";
import { clearAutoSavedValue } from "../hooks/useAutoSave";

export default function CreateArticlePage() {
    const navigate = useNavigate();
    const { mutate: createArticle, isPending } = useCreateArticle();
    const [content, setContent] = useState("");
    const [title, setTitle] = useState("");
    const [type, setType] = useState<ArticleType>("documentation");
    const [isPublic] = useState(false);
    const autoSaveKey = "create-article-content";

    const handleSubmit = () => {
        createArticle(
            {
                title,
                content,
                type,
                isPublic,
            },
            {
                onSuccess: (data: any) => {
                    // Clear autosaved content after successful submission
                    clearAutoSavedValue(autoSaveKey);

                    if (type === "documentation") {
                        navigate(`/docs/${data.article.slug}`);
                    }
                },
            },
        );
    };

    return (
        <Stack gap="lg">
            <Alert icon={<FontAwesomeIcon icon="exclamation-triangle" />} title="Warning" color="red" variant="light">
                Do not interact with this unless you know what you're doing.
                <br />
                This page is not intended for streamlined usage yet, and will definitely get a rehaul when committee
                members will need to create articles.
            </Alert>

            <Card shadow="sm" p="lg">
                <Stack gap="md">
                    <TextInput
                        label="Title"
                        value={title}
                        onChange={(e) => setTitle(e.currentTarget.value)}
                        placeholder="Enter article title..."
                        required
                    />

                    <Select
                        label="Type"
                        value={type}
                        onChange={(value) => {
                            const next = value ? pickStringUnion(value, ARTICLE_TYPES) : undefined;
                            if (next) setType(next);
                        }}
                        data={[
                            { value: "documentation", label: "Documentation" },
                            { value: "resource", label: "Resource" },
                        ]}
                        required
                        error={!type && "Type is required"}
                        allowDeselect={false}
                        withAsterisk
                        disabled
                    />

                    <Switch
                        label="Public"
                        checked={isPublic}
                        disabled
                        description={
                            type === "resource"
                                ? "Resource articles are always public"
                                : "Documentation is always private"
                        }
                    />

                    <Box>
                        <Box mb={5} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <Box component="label" style={{ fontWeight: 500, fontSize: "14px" }}>
                                Content<span style={{ color: "var(--mantine-color-red-filled)" }}> *</span>
                            </Box>
                            <TextLengthIndicator length={content.length} maxLength={50000} />
                        </Box>
                        <TextEditor
                            value={content}
                            onChange={setContent}
                            placeholder="Enter article content..."
                            minHeight={300}
                            autoSaveKey={autoSaveKey}
                        />
                    </Box>

                    <Group justify="flex-end">
                        <Button onClick={handleSubmit} loading={isPending}>
                            Create Article
                        </Button>
                    </Group>
                </Stack>
            </Card>

            {content && (
                <Card shadow="sm" p="lg">
                    <Stack gap="md">
                        <Title order={3}>Preview</Title>
                        <Divider />
                        <MarkdownText content={content} allowHtml={type === "documentation" && !isPublic} />
                    </Stack>
                </Card>
            )}
        </Stack>
    );
}
