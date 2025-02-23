// Base
import { useState } from "react";
import { useUpdateVoting } from "../../hooks/useVotings";
import { IVoting } from "../../../interfaces/Voting";
import { VOTE_COLORS } from "../../constants";

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
    Divider,
    Pill,
    Textarea,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface IProps {
    voting: IVoting;
    opened: boolean;
    onClose: () => void;
}

export default function VotingEditModal({ voting, opened, onClose }: IProps) {
    const updateVotingMutation = useUpdateVoting(voting._id);
    const [newOption, setNewOption] = useState("");
    const hasVotes = voting.votes.length > 0;

    const form = useForm({
        initialValues: {
            title: voting.title,
            description: voting.description,
            duration: voting.duration,
            options: [...voting.options],
            type: voting.type, // Add type to form values
        },
        validate: {
            title: (value) => (!value ? "Title is required" : null),
            description: (value) => (!value ? "Description is required" : null),
            duration: (value) => (value < 1 ? "Duration must be at least 1 day" : null),
            options: (value) => {
                if (value.length < 2) return "At least two options are required";
                if (voting.type === "binary" && value.length !== 2) {
                    return "Binary votes must have exactly 2 options";
                }
                return null;
            },
        },
    });

    const handleSubmit = async (values) => {
        await updateVotingMutation.mutateAsync(values);
        onClose();
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

    return (
        <Modal opened={opened} onClose={onClose} title="Edit Voting" size="lg">
            <LoadingOverlay
                visible={updateVotingMutation.isPending}
                zIndex={1000}
                overlayProps={{ radius: "sm", blur: 2 }}
            />
            <form onSubmit={form.onSubmit(handleSubmit)} style={{ position: "relative" }}>
                <Stack gap="md">
                    <Divider />
                    <TextInput
                        label="Title"
                        placeholder="Enter voting title"
                        withAsterisk
                        {...form.getInputProps("title")}
                    />

                    <Textarea
                        label="Description"
                        placeholder="Enter voting description"
                        withAsterisk
                        minRows={3}
                        maxRows={8}
                        resize="vertical"
                        autosize
                        {...form.getInputProps("description")}
                    />

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
