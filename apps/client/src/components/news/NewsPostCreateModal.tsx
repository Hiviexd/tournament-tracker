import { Modal, TextInput, Stack, Button, Box, Checkbox } from "@mantine/core";
import { useForm } from "@mantine/form";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useCreateNewsPost } from "../../hooks/useNewsPosts";
import TextEditor from "../common/TextEditor";
import { clearAutoSavedValue } from "../../hooks/useAutoSave";

interface IProps {
    opened: boolean;
    onClose: () => void;
}

export default function NewsPostCreateModal({ opened, onClose }: IProps) {
    const createNewsPostMutation = useCreateNewsPost();
    const autoSaveKey = "news-post-create-content";

    const form = useForm({
        initialValues: {
            title: "",
            content: "",
            pingNewsRole: false,
        },
        validate: {
            title: (value) => (value.trim().length < 3 ? "Title must be at least 3 characters" : null),
            content: (value) => (value.trim().length < 10 ? "Content must be at least 10 characters" : null),
        },
    });

    const handleSubmit = async (values: { title: string; content: string; pingNewsRole: boolean }) => {
        try {
            await createNewsPostMutation.mutateAsync(values);
            clearAutoSavedValue(autoSaveKey);
            form.reset();
            onClose();
        } catch (error) {
            console.error("Failed to create news post:", error);
        }
    };

    return (
        <Modal opened={opened} onClose={onClose} title="Create News Post" size="xl">
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
                    <Checkbox
                        label="Ping the news role on Discord"
                        {...form.getInputProps("pingNewsRole", { type: "checkbox" })}
                    />
                    <Button
                        type="submit"
                        loading={createNewsPostMutation.isPending}
                        leftSection={<FontAwesomeIcon icon="plus" />}>
                        Create News Post
                    </Button>
                </Stack>
            </form>
        </Modal>
    );
}
