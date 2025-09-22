import { Modal, TextInput, Select, Stack, Button, Textarea } from "@mantine/core";
import { useForm } from "@mantine/form";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ResourceType, ResourceCategory, IResource } from "../../../interfaces/Resource";
import { useCreateResource } from "../../hooks/useResources";
import UserSearch from "../common/UserSearch";

interface IProps {
    opened: boolean;
    onClose: () => void;
    defaultType?: ResourceType;
}

export default function ResourcesCreateModal({ opened, onClose, defaultType = "community" }: IProps) {
    const createResourceMutation = useCreateResource();

    const form = useForm({
        initialValues: {
            title: "",
            description: "",
            category: "" as ResourceCategory,
            type: defaultType,
            link: "",
            author: "",
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

    const categoryOptions = [
        { value: "discord", label: "Discord Server" },
        { value: "guide", label: "Guide" },
        { value: "tool", label: "Tool" },
        { value: "spreadsheet", label: "Spreadsheet" },
        { value: "article", label: "Article" },
    ] as const;

    const handleSubmit = async (values) => {
        try {
            // Create the resource object directly
            const resourceData: Partial<IResource> = {
                title: values.title,
                description: values.description,
                category: values.category,
                type: defaultType,
                link: values.link,
            };

            // Only add author if it exists
            if (values.author) {
                resourceData.author = values.author;
            }

            await createResourceMutation.mutateAsync(resourceData);

            form.reset();
            onClose();
        } catch (error) {
            console.error("Failed to create resource:", error);
        }
    };

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={defaultType === "community" ? "Create Community Resource" : "Create Official Resource"}
            size="lg">
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
                        placeholder="Select optional author..."
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
                    <Button
                        type="submit"
                        loading={createResourceMutation.isPending}
                        leftSection={<FontAwesomeIcon icon="plus" />}>
                        Create Resource
                    </Button>
                </Stack>
            </form>
        </Modal>
    );
}
