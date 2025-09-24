import { Modal, TextInput, Select, Stack, Button, Textarea, Group } from "@mantine/core";
import { useForm } from "@mantine/form";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IResource, ResourceCategory } from "../../../interfaces/Resource";
import { useDeleteResource, useUpdateResource } from "../../hooks/useResources";
import { useConfirmModal } from "../../hooks/useModals";
import UserSearch from "../common/UserSearch";
import { useEffect } from "react";

interface IProps {
    opened: boolean;
    onClose: () => void;
    resource: IResource | null;
}

export default function ResourcesEditModal({ opened, onClose, resource }: IProps) {
    const updateResourceMutation = useUpdateResource(resource?.id || "");
    const deleteResourceMutation = useDeleteResource(resource?.id || "");
    const confirmModal = useConfirmModal();

    const form = useForm({
        initialValues: {
            title: resource?.title || "",
            description: resource?.description || "",
            category: resource?.category || ("" as ResourceCategory),
            type: resource?.type || "community",
            link: resource?.link || "",
            author: resource?.author?._id || "",
        },
        validate: {
            title: (value) => (!value ? "Title is required" : null),
            description: (value) => (!value ? "Description is required" : null),
            category: (value) => (!value ? "Category is required" : null),
            link: (value) => {
                if (!value) return "Link is required";
                try {
                    new URL(value);
                    return null;
                } catch {
                    return "Invalid URL";
                }
            },
        },
    });

    // Update form values when resource changes
    useEffect(() => {
        if (resource) {
            form.setValues({
                title: resource.title,
                description: resource.description,
                category: resource.category,
                type: resource.type,
                link: resource.link,
                author: resource.author?._id || "",
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [resource]);

    const categoryOptions = [
        { value: "discord", label: "Discord Server" },
        { value: "guide", label: "Guide" },
        { value: "tool", label: "Tool" },
        { value: "spreadsheet", label: "Spreadsheet" },
        { value: "article", label: "Article" },
    ] as const;

    const handleSubmit = async (values) => {
        try {
            const resourceData: Partial<IResource> = {
                title: values.title,
                description: values.description,
                category: values.category,
                type: values.type,
                link: values.link,
            };

            if (values.author) {
                resourceData.author = values.author;
            }

            await updateResourceMutation.mutateAsync(resourceData);
            onClose();
        } catch (error) {
            console.error("Failed to update resource:", error);
        }
    };

    const handleDelete = async () => {
        if (
            await confirmModal({
                preset: "delete",
                title: `Delete resource?`,
                text: "Are you sure you want to delete this resource? This action is irreversible.",
            })
        ) {
            try {
                await deleteResourceMutation.mutateAsync();
                onClose();
            } catch (error) {
                console.error("Failed to delete resource:", error);
            }
        }
    };

    return (
        <Modal opened={opened} onClose={onClose} title="Edit Resource" size="lg">
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack gap="md">
                    <TextInput
                        withAsterisk
                        label="Title"
                        placeholder="Resource title..."
                        {...form.getInputProps("title")}
                    />
                    <UserSearch
                        label="Author"
                        placeholder="Input new author..."
                        onChange={(value) => form.setFieldValue("author", value?.id || "")}
                        error={form.errors.author}
                        allowUserCreation
                    />
                    <Textarea
                        withAsterisk
                        label="Description"
                        placeholder="Resource description..."
                        minRows={3}
                        {...form.getInputProps("description")}
                    />
                    <Select
                        withAsterisk
                        label="Category"
                        placeholder="Select category..."
                        data={categoryOptions}
                        {...form.getInputProps("category")}
                    />
                    <TextInput withAsterisk label="Link" placeholder="https://..." {...form.getInputProps("link")} />
                    <Group justify="space-between">
                        <Button
                            type="button"
                            variant="outline"
                            color="danger"
                            leftSection={<FontAwesomeIcon icon="trash" />}
                            onClick={handleDelete}
                            loading={deleteResourceMutation.isPending}>
                            Delete
                        </Button>
                        <Button
                            type="submit"
                            loading={updateResourceMutation.isPending}
                            leftSection={<FontAwesomeIcon icon="save" />}>
                            Save Changes
                        </Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
}
