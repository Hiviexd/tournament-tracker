// Base
import { useState } from "react";
import { useUpdateVoting } from "../../hooks/useVotings";
import { IVoting } from "../../../interfaces/Voting";

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

    const form = useForm({
        initialValues: {
            title: voting.title,
            description: voting.description,
            duration: voting.duration,
            options: [...voting.options],
        },
        validate: {
            title: (value) => (!value ? "Title is required" : null),
            description: (value) => (!value ? "Description is required" : null),
            duration: (value) => (value < 1 ? "Duration must be at least 1 day" : null),
            options: (value) => (value.length < 2 ? "At least two options are required" : null),
        },
    });

    const handleSubmit = async (values) => {
        await updateVotingMutation.mutateAsync(values);
        onClose();
    };

    const handleAddOption = () => {
        const trimmedOption = newOption.trim();
        if (trimmedOption && !form.values.options.includes(trimmedOption)) {
            form.setFieldValue("options", [...form.values.options, trimmedOption]);
            setNewOption("");
        }
    };

    const handleRemoveOption = (optionToRemove: string) => {
        // Don't allow removing options that already have votes
        const hasVotes = voting.votes.some(
            (vote) => voting.options[vote.option] === optionToRemove
        );

        if (hasVotes) {
            return;
        }

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

    const isOptionRemovable = (option: string) => {
        return !voting.votes.some((vote) => voting.options[vote.option] === option);
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
                                    withRemoveButton={isOptionRemovable(option)}
                                    onRemove={() => handleRemoveOption(option)}>
                                    {option}
                                    {!isOptionRemovable(option) && (
                                        <Text span size="xs" ml={5} c="dimmed">
                                            (has votes)
                                        </Text>
                                    )}
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
