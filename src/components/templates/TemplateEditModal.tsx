import { Modal, TextInput, Stack, Button, Group, Box } from "@mantine/core";
import { useForm } from "@mantine/form";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ITemplate } from "../../../interfaces/Template";
import { useDeleteTemplate, useUpdateTemplate } from "../../hooks/useTemplates";
import { useEffect } from "react";
import TextEditor from "../common/TextEditor";
import { clearAutoSavedValue } from "../../hooks/useAutoSave";

interface IProps {
    opened: boolean;
    onClose: () => void;
    template: ITemplate | null;
}

export default function TemplateEditModal({ opened, onClose, template }: IProps) {
    const updateTemplateMutation = useUpdateTemplate(template?._id || "");
    const deleteTemplateMutation = useDeleteTemplate(template?._id || "");
    const autoSaveKey = `template-edit-${template?._id || "new"}-content`;

    const form = useForm({
        initialValues: {
            name: template?.name || "",
            content: template?.content || "",
            category: template?.category || "",
        },
        validate: {
            name: (value) => (!value ? "Template name is required" : null),
            content: (value) => (!value ? "Template content is required" : null),
            category: (value) => (!value ? "Category is required" : null),
        },
    });

    // Update form values when template changes
    useEffect(() => {
        if (template) {
            form.setValues({
                name: template.name,
                content: template.content,
                category: template.category,
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [template]);

    const handleSubmit = async (values: { name: string; content: string; category: string }) => {
        try {
            await updateTemplateMutation.mutateAsync(values);

            // Clear autosaved content after successful submission
            clearAutoSavedValue(autoSaveKey);

            onClose();
        } catch (error) {
            console.error("Failed to update template:", error);
        }
    };

    const handleDelete = async () => {
        if (confirm("Are you sure you want to delete this template?")) {
            try {
                await deleteTemplateMutation.mutateAsync();
                onClose();
            } catch (error) {
                console.error("Failed to delete template:", error);
            }
        }
    };

    return (
        <Modal opened={opened} onClose={onClose} title="Edit Template" size="xl">
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
                    <Group justify="space-between">
                        <Button
                            type="button"
                            variant="outline"
                            color="danger"
                            leftSection={<FontAwesomeIcon icon="trash" />}
                            onClick={handleDelete}
                            loading={deleteTemplateMutation.isPending}>
                            Delete
                        </Button>
                        <Button
                            type="submit"
                            loading={updateTemplateMutation.isPending}
                            leftSection={<FontAwesomeIcon icon="save" />}>
                            Save Changes
                        </Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
}
