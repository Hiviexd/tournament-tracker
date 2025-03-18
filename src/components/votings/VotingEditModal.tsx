// Base
import { useState } from "react";
import { useUpdateVoting } from "../../hooks/useVotings";
import { IVoting } from "../../../interfaces/Voting";
import { VOTE_COLORS } from "../../constants";
import { clearAutoSavedValue } from "../../hooks/useAutoSave";

// Mantine
import {
    Modal,
    TextInput,
    Stack,
    NumberInput,
    Button,
    Group,
    LoadingOverlay,
    ActionIcon,
    Text,
    Pill,
    Box,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import TextEditor from "../common/TextEditor";

interface IProps {
    voting: IVoting;
    opened: boolean;
    onClose: () => void;
}

export default function VotingEditModal({ voting, opened, onClose }: IProps) {
    const updateVotingMutation = useUpdateVoting(voting._id);
    const [newOption, setNewOption] = useState("");
    const [editorKey, setEditorKey] = useState(0);
    const hasVotes = voting.votes.length > 0;
    const privateDescriptionAutoSaveKey = `voting-edit-private-description-${voting._id}`;
    const publicDescriptionAutoSaveKey = `voting-edit-public-description-${voting._id}`;

    const form = useForm({
        initialValues: {
            title: voting.title,
            description: voting.description,
            publicDescription: voting.publicDescription || "",
            duration: voting.duration,
            options: [...voting.options],
            type: voting.type, // Add type to form values
        },
        validate: {
            title: (value) => {
                if (!value.trim()) return "Title is required";
                if (value.length < 5) return "Title must be at least 5 characters";
                if (value.length > 100) return "Title cannot exceed 100 characters";
                return null;
            },
            description: (value) => {
                if (!value.trim()) return "Description is required";
                if (value.length < 10) return "Description must be at least 10 characters";
                if (value.length > 6000) return "Description cannot exceed 6000 characters";
                return null;
            },
            publicDescription: (value) => {
                if (value.length > 6000) return "Public description cannot exceed 6000 characters";
                return null;
            },
            duration: (value) => {
                if (!value) return "Duration is required";
                if (value < 1) return "Duration must be at least 1 day";
                if (value > 30) return "Duration cannot exceed 30 days";
                return null;
            },
            options: (value) => {
                if (value.length < 2) return "At least 2 options are required";
                if (voting.type === "binary" && value.length !== 2) {
                    return "Binary votes must have exactly 2 options";
                }
                return null;
            },
        },
    });

    const handleSubmit = async (values) => {
        try {
            await updateVotingMutation.mutateAsync(values);

            // Clear autosaved content after successful submission
            clearAutoSavedValue(privateDescriptionAutoSaveKey);
            clearAutoSavedValue(publicDescriptionAutoSaveKey);

            // Reset the editor key to ensure it re-renders with the new content
            setEditorKey((prev) => prev + 1);

            // Reset form with new values to ensure it's in sync
            form.setValues(values);
            form.resetDirty();

            onClose();
        } catch (error) {
            console.error("Failed to update voting:", error);
        }
    };

    const handleAddOption = () => {
        if (hasVotes) return;

        const trimmedOption = newOption.trim();
        if (trimmedOption && !form.values.options.includes(trimmedOption)) {
            form.setFieldValue("options", [...form.values.options, trimmedOption]);
            setNewOption("");
        }
    };

    const handleRemoveOption = (optionToRemove: string) => {
        if (hasVotes) return;

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

    const handleLoadPrivateDescription = () => {
        clearAutoSavedValue(publicDescriptionAutoSaveKey);
        form.setFieldValue("publicDescription", voting.description);
        // Force TextEditor to remount by changing its key
        setEditorKey((prev) => prev + 1);
        // Trigger form validation to ensure the UI updates
        form.validate();
    };

    return (
        <Modal opened={opened} onClose={onClose} title="Edit Vote" size="xl">
            <LoadingOverlay
                visible={updateVotingMutation.isPending}
                zIndex={1000}
                overlayProps={{ radius: "sm", blur: 2 }}
            />
            <form onSubmit={form.onSubmit(handleSubmit)} style={{ position: "relative" }}>
                <Stack gap="md">
                    {voting.isActive && (
                        <TextInput
                            label="Title"
                            placeholder="Enter vote title"
                            withAsterisk
                            {...form.getInputProps("title")}
                        />
                    )}
                    <Box>
                        {voting.isActive ? (
                            <>
                                <Box
                                    mb={5}
                                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <Box component="label" style={{ fontWeight: 500, fontSize: "14px" }}>
                                        Description<span style={{ color: "var(--mantine-color-red-filled)" }}> *</span>
                                    </Box>
                                </Box>
                                <TextEditor
                                    value={form.values.description}
                                    onChange={(value) => form.setFieldValue("description", value)}
                                    placeholder="Enter vote description"
                                    minHeight={120}
                                    stickyOffset={60}
                                    className={form.errors.description ? "error" : ""}
                                    autoSaveKey={privateDescriptionAutoSaveKey}
                                    style={{ flex: "1 1 auto", minHeight: 120 }}
                                />
                                {form.errors.description && (
                                    <Box mt={5} style={{ color: "var(--mantine-color-red-filled)", fontSize: "12px" }}>
                                        {form.errors.description}
                                    </Box>
                                )}
                            </>
                        ) : (
                            <>
                                <Box mb={5} style={{ display: "flex", gap: 5, alignItems: "center" }}>
                                    <Box component="label" style={{ fontWeight: 500, fontSize: "14px" }}>
                                        Public Description
                                    </Box>
                                    <Button size="xs" variant="subtle" onClick={handleLoadPrivateDescription}>
                                        Load private description
                                    </Button>
                                </Box>
                                <Text size="xs" c="dimmed" mb="md">
                                    This description will be shown to the public after the vote is concluded and
                                    published.
                                </Text>
                                <TextEditor
                                    key={editorKey}
                                    value={form.values.publicDescription}
                                    onChange={(value) => form.setFieldValue("publicDescription", value)}
                                    placeholder="Enter public description"
                                    minHeight={120}
                                    stickyOffset={60}
                                    className={form.errors.publicDescription ? "error" : ""}
                                    autoSaveKey={publicDescriptionAutoSaveKey}
                                    style={{ flex: "1 1 auto", minHeight: 120 }}
                                />
                                {form.errors.publicDescription && (
                                    <Box mt={5} style={{ color: "var(--mantine-color-red-filled)", fontSize: "12px" }}>
                                        {form.errors.publicDescription}
                                    </Box>
                                )}
                            </>
                        )}
                    </Box>

                    {voting.isActive && (
                        <>
                            <NumberInput
                                label="Duration (days)"
                                placeholder="Enter duration in days"
                                withAsterisk
                                min={1}
                                {...form.getInputProps("duration")}
                            />

                            <Stack gap="xs">
                                <Group justify="space-between">
                                    <Text size="sm" fw={500}>
                                        Options {voting.type === "binary" && "(Must be exactly 2)"}
                                        {voting.type === "variable" && "(Each will be rated -5 to +5)"}
                                    </Text>
                                    {hasVotes && (
                                        <Text size="xs" c="dimmed">
                                            Options cannot be modified after votes are cast
                                        </Text>
                                    )}
                                </Group>
                                <Group gap="xs">
                                    {form.values.options.length === 0 ? (
                                        <Text size="xs" c="danger">
                                            No options!
                                        </Text>
                                    ) : (
                                        form.values.options.map((option, index) => (
                                            <Pill
                                                key={index}
                                                withRemoveButton={!hasVotes}
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
                                        ))
                                    )}
                                </Group>
                                {!hasVotes && (
                                    <Group gap="xs" flex={1} align="flex-start">
                                        <TextInput
                                            placeholder="Add new option"
                                            size="xs"
                                            value={newOption}
                                            onChange={(e) => setNewOption(e.currentTarget.value)}
                                            onKeyDown={handleKeyPress}
                                            error={form.errors.options}
                                            disabled={form.values.type === "binary" && form.values.options.length >= 2}
                                        />
                                        <ActionIcon
                                            variant="filled"
                                            color="primary"
                                            onClick={handleAddOption}
                                            disabled={
                                                !newOption.trim() ||
                                                (form.values.type === "binary" && form.values.options.length >= 2)
                                            }>
                                            <FontAwesomeIcon icon="plus" />
                                        </ActionIcon>
                                    </Group>
                                )}
                            </Stack>
                        </>
                    )}

                    <Group justify="flex-end" mt="md">
                        <Button variant="subtle" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" loading={updateVotingMutation.isPending}>
                            Save Changes
                        </Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
}
