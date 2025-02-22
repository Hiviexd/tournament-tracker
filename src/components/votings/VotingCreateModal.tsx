// Base
import { useState } from "react";
import { useCreateVoting } from "../../hooks/useVotings";
import { VotingCategory, type VotingFormData } from "../../../interfaces/Voting";
import { UserGroup } from "../../../interfaces/User";
import { VOTE_COLORS } from "../../constants";
import { useFileUpload } from "../../hooks/useFileUpload";

//Mantine
import {
    Modal,
    TextInput,
    Stack,
    Select,
    MultiSelect,
    Textarea,
    NumberInput,
    Button,
    Group,
    Pill,
    ActionIcon,
    Text,
    FileInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

// Components
import UserSearch from "../common/UserSearch";

interface IProps {
    opened: boolean;
    onClose: () => void;
}

export default function VotingCreateModal({ opened, onClose }: IProps) {
    const createVotingMutation = useCreateVoting();
    const { files, handleFileChange } = useFileUpload();
    const [newOption, setNewOption] = useState("");

    const form = useForm({
        initialValues: {
            title: "",
            description: "",
            category: "" as VotingCategory,
            assignedGroups: [] as UserGroup[],
            duration: 3,
            options: ["Yes", "No"],
            targetUserId: "",
            targetTournamentId: "",
        },
        validate: {
            title: (value) => (!value ? "Title is required" : null),
            description: (value) => (!value ? "Description is required" : null),
            category: (value) => (!value ? "Category is required" : null),
            assignedGroups: (value) => (value.length === 0 ? "At least one group is required" : null),
            duration: (value) => (value < 1 ? "Duration must be at least 1 day" : null),
            options: (value) => (value.length < 2 ? "At least two options are required" : null),
            targetUserId: (value, values) => (values.category === "user" && !value ? "Target user is required" : null),
            targetTournamentId: (value, values) =>
                values.category === "tournament" && !value ? "Target tournament is required" : null,
        },
    });

    const handleSubmit = form.onSubmit(async (values) => {
        const formData = new FormData() as VotingFormData;

        // Add form fields
        Object.entries(values).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== "") {
                if (Array.isArray(value)) {
                    // Handle arrays by appending each value with the same key
                    value.forEach((item) => {
                        formData.append(key, item);
                    });
                } else {
                    formData.append(key, value.toString());
                }
            }
        });

        // Add files
        files.forEach((file) => formData.append("files", file));

        await createVotingMutation.mutateAsync(formData);
        form.reset();
        onClose();
    });

    const handleAddOption = () => {
        const trimmedOption = newOption.trim();
        if (trimmedOption && !form.values.options.includes(trimmedOption)) {
            form.setFieldValue("options", [...form.values.options, trimmedOption]);
            setNewOption("");
        }
    };

    const handleRemoveOption = (optionToRemove: string) => {
        form.setFieldValue(
            "options",
            form.values.options.filter((option) => option !== optionToRemove)
        );
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleAddOption();
        }
    };

    const categoryOptions = [
        { value: "discussion", label: "Discussion" },
        { value: "tournament", label: "Tournament" },
        { value: "user", label: "User" },
    ];

    const groupOptions = [
        { value: "tc", label: "Tournament Committee" },
        { value: "cc", label: "Contest Committee" },
    ];

    return (
        <Modal opened={opened} onClose={onClose} title="Create New Vote" size="lg">
            <form onSubmit={handleSubmit} style={{ position: "relative" }}>
                <Stack gap="md">
                    <TextInput
                        label="Title"
                        placeholder="Enter vote title"
                        withAsterisk
                        {...form.getInputProps("title")}
                    />

                    <Textarea
                        label="Description"
                        placeholder="Enter vote description"
                        withAsterisk
                        minRows={3}
                        maxRows={8}
                        resize="vertical"
                        autosize
                        {...form.getInputProps("description")}
                    />

                    <Select
                        label="Category"
                        placeholder="Select vote category"
                        data={categoryOptions}
                        withAsterisk
                        {...form.getInputProps("category")}
                    />

                    {form.values.category === "user" && (
                        <UserSearch
                            label="Target User"
                            onChange={(value) => form.setFieldValue("targetUserId", value?.id)}
                            error={form.errors.targetUserId}
                            required
                        />
                    )}

                    {form.values.category === "tournament" && (
                        <TextInput
                            label="Target Tournament ID"
                            placeholder="Enter target tournament ID"
                            withAsterisk
                            {...form.getInputProps("targetTournamentId")}
                        />
                    )}

                    <MultiSelect
                        label="Assigned Groups"
                        placeholder="Select assigned groups"
                        data={groupOptions}
                        withAsterisk
                        {...form.getInputProps("assignedGroups")}
                    />

                    <NumberInput
                        label="Duration (days)"
                        placeholder="Enter duration in days"
                        withAsterisk
                        min={1}
                        {...form.getInputProps("duration")}
                    />

                    <Stack gap="xs">
                        <Text size="sm" fw={500}>
                            Options
                        </Text>
                        <Group gap="xs">
                            {form.values.options.length === 0 && (
                                <Text size="xs" c="danger">
                                    No options!
                                </Text>
                            )}
                            {form.values.options.map((option, index) => (
                                <Pill
                                    key={index}
                                    withRemoveButton
                                    onRemove={() => handleRemoveOption(option)}
                                    variant="subtle"
                                    style={{
                                        backgroundColor: `color-mix(in srgb, ${
                                            VOTE_COLORS[index % VOTE_COLORS.length]
                                        } 15%, transparent)`,
                                        color: VOTE_COLORS[index % VOTE_COLORS.length],
                                        transition: "all 0.2s ease",
                                    }}>
                                    {option}
                                </Pill>
                            ))}
                        </Group>
                        <Group gap="xs" flex={1} align="flex-start">
                            <TextInput
                                placeholder="Add new option"
                                size="xs"
                                value={newOption}
                                onChange={(e) => setNewOption(e.currentTarget.value)}
                                onKeyDown={handleKeyPress}
                                error={form.errors.options}
                            />
                            <ActionIcon
                                variant="filled"
                                color="primary"
                                onClick={handleAddOption}
                                disabled={!newOption.trim()}>
                                <FontAwesomeIcon icon="plus" />
                            </ActionIcon>
                        </Group>
                    </Stack>

                    <FileInput
                        accept=".jpg,.png,.zip,.rar,.txt"
                        multiple
                        leftSection={<FontAwesomeIcon icon="upload" />}
                        label="Attachments"
                        description="Up to 5 files (5MB each, allowed types: jpg, png, zip, rar, txt)"
                        placeholder="Upload files"
                        value={files}
                        onChange={handleFileChange}
                    />

                    <Group justify="flex-end" mt="md">
                        <Button variant="subtle" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" loading={createVotingMutation.isPending}>
                            Create Voting
                        </Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
}
