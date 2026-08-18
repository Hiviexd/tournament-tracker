import { Modal, TextInput, Stack, Button, Box } from "@mantine/core";
import { useForm } from "@mantine/form";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IArticle } from "@tc/types/Article";
import { useEditNewsPost } from "../../hooks/useNewsPosts";
import { useEffect } from "react";
import TextEditor from "../common/TextEditor";
import { clearAutoSavedValue } from "../../hooks/useAutoSave";
import MultiSelect from "../common/MultiSelect";
import { NEWS_CATEGORY_OPTIONS } from "./NewsCategoryIcons";

interface IProps {
    opened: boolean;
    onClose: () => void;
    article: IArticle | null;
}

export default function NewsPostEditModal({ opened, onClose, article }: IProps) {
    const editNewsPostMutation = useEditNewsPost(article?.slug || "");
    const autoSaveKey = `news-post-edit-${article?._id || "new"}-content`;

    const form = useForm({
        initialValues: {
            title: article?.title || "",
            content: article?.content || "",
            categories: article?.categories ?? [],
        },
        validate: {
            title: (value) => (value.trim().length < 3 ? "Title must be at least 3 characters" : null),
            content: (value) => (value.trim().length < 10 ? "Content must be at least 10 characters" : null),
            categories: (value) => (value.length === 0 ? "Select at least one category" : null),
        },
    });

    useEffect(() => {
        if (article) {
            form.setValues({
                title: article.title,
                content: article.content,
                categories: article.categories ?? [],
            });
        }
        // eslint-disable-next-line react/exhaustive-deps
    }, [article]);

    const handleSubmit = async (values: { title: string; content: string; categories: string[] }) => {
        try {
            await editNewsPostMutation.mutateAsync(values);
            clearAutoSavedValue(autoSaveKey);
            onClose();
        } catch (error) {
            console.error("Failed to update news post:", error);
        }
    };

    return (
        <Modal opened={opened} onClose={onClose} title="Edit News Post" size="xl">
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack gap="md">
                    <TextInput
                        withAsterisk
                        label="Title"
                        placeholder="News post title"
                        {...form.getInputProps("title")}
                    />
                    <Box>
                        <Box mb={5} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <Box component="label" style={{ fontWeight: 500, fontSize: "14px" }}>
                                Content<span style={{ color: "var(--mantine-color-red-filled)" }}> *</span>
                            </Box>
                        </Box>
                        <TextEditor
                            value={form.values.content}
                            onChange={(value) => form.setFieldValue("content", value)}
                            placeholder="Write the news post in markdown..."
                            className={form.errors.content ? "error" : ""}
                            autoSaveKey={autoSaveKey}
                            minHeight={160}
                        />
                        {form.errors.content && (
                            <Box mt={5} style={{ color: "var(--mantine-color-red-filled)", fontSize: "12px" }}>
                                {form.errors.content}
                            </Box>
                        )}
                    </Box>
                    <MultiSelect
                        withAsterisk
                        label="Category"
                        placeholder="Select tournament and/or contest"
                        data={NEWS_CATEGORY_OPTIONS}
                        {...form.getInputProps("categories")}
                    />
                    <Button
                        type="submit"
                        loading={editNewsPostMutation.isPending}
                        leftSection={<FontAwesomeIcon icon="save" />}>
                        Save Changes
                    </Button>
                </Stack>
            </form>
        </Modal>
    );
}
