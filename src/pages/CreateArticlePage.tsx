import { useState } from "react";
import { Card, Stack, TextInput, Textarea, Switch, Select, Button, Group, Alert, Title, Divider } from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { useCreateArticle } from "../hooks/useArticle";
import MarkdownText from "../components/common/MarkdownText";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ArticleType } from "@interfaces/Article";

export default function CreateArticlePage() {
    const navigate = useNavigate();
    const { mutate: createArticle, isPending } = useCreateArticle();
    const [content, setContent] = useState("");
    const [title, setTitle] = useState("");
    const [isPublic, setIsPublic] = useState(false);
    const [type, setType] = useState<ArticleType>("documentation");

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
                    if (type === "documentation") {
                        navigate(`/docs/${data.article.slug}`);
                    }
                },
            }
        );
    };

    return (
        <Stack gap="lg">
            <Alert icon={<FontAwesomeIcon icon="exclamation-triangle" />} title="Warning" color="red" variant="light">
                Do not interact with this unless you know what you're doing.
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
                        onChange={(value) => setType(value as ArticleType)}
                        data={[
                            { value: "documentation", label: "Documentation" },
                            { value: "resource", label: "Resource" },
                        ]}
                        required
                        error={!type && "Type is required"}
                    />

                    <Switch label="Public" checked={isPublic} onChange={(e) => setIsPublic(e.currentTarget.checked)} />

                    <Textarea
                        label="Content"
                        value={content}
                        onChange={(e) => setContent(e.currentTarget.value)}
                        placeholder="Enter article content in Markdown..."
                        minRows={10}
                        autosize
                        required
                    />

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
