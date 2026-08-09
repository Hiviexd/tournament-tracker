import { Modal, TextInput, Stack, Button, Box } from "@mantine/core";
import { useForm } from "@mantine/form";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useCreateTemplate } from "../../hooks/useTemplates";
import TextEditor from "../common/TextEditor";
import { clearAutoSavedValue } from "../../hooks/useAutoSave";

interface IProps {
    opened: boolean;
    onClose: () => void;
}

export default function TemplateCreateModal({ opened, onClose }: IProps) {
    const createTemplateMutation = useCreateTemplate();
    const autoSaveKey = "template-create-content";

    const form = useForm({
        initialValues: {
            name: "",
            content: "",
            category: "",
        },
        validate: {
            name: (value) => (!value ? "Template name is required" : null),
            content: (value) => (!value ? "Template content is required" : null),
            category: (value) => (!value ? "Category is required" : null),
        },
    });

    const handleSubmit = async (values: { name: string; content: string; category: string }) => {
        try {
            await createTemplateMutation.mutateAsync(values);

            // Clear autosaved content after successful submission
            clearAutoSavedValue(autoSaveKey);

            form.reset();
            onClose();
        } catch (error) {
            console.error("Failed to create template:", error);
        }
    };

    return (
        <Modal opened={opened} onClose={onClose} title="Create Template" size="xl">
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack gap="md">
                    <TextInput
                        withAsterisk
                        label="Template Name"
                        placeholder="e.g. Generic confirmation"
                        {...form.getInputProps("name")}
                    />
                    <TextInput
                        withAsterisk
                        label="Category"
                        placeholder="e.g. Tournament Report Responses"
                        {...form.getInputProps("category")}
                    />
                    <Box>
                        <Box mb={5} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <Box component="label" style={{ fontWeight: 500, fontSize: "14px" }}>
                                Template Content<span style={{ color: "var(--mantine-color-red-filled)" }}> *</span>
                            </Box>
                        </Box>
                        <TextEditor
                            value={form.values.content}
                            onChange={(value) => form.setFieldValue("content", value)}
                            placeholder="Enter the template text content..."
                            className={form.errors.content ? "error" : ""}
                            autoSaveKey={autoSaveKey}
                            minHeight={120}
                        />
                        {form.errors.content && (
                            <Box mt={5} style={{ color: "var(--mantine-color-red-filled)", fontSize: "12px" }}>
                                {form.errors.content}
                            </Box>
                        )}
                    </Box>
                    <Button
                        type="submit"
                        loading={createTemplateMutation.isPending}
                        leftSection={<FontAwesomeIcon icon="plus" />}>
                        Create Template
                    </Button>
                </Stack>
            </form>
        </Modal>
    );
}
