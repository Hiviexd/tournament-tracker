// Base
import { useEffect, useCallback } from "react";
import { useCreateVoting } from "../../hooks/useVotings";
import { VotingCategory, type VotingFormData, VotingType } from "../../../interfaces/Voting";
import { UserGroup } from "../../../interfaces/User";
import { VOTE_COLORS, PREDEFINED_OPTIONS, VOTE_PRESETS } from "../../constants";
import { useFileUpload } from "../../hooks/useFileUpload";
import helpers from "../../helpers";

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
    Text,
} from "@mantine/core";
import { useForm } from "@mantine/form";

// Components
import UserSearch from "../common/UserSearch";
import FileUploadInput from "../common/FileUploadInput";
import OptionSearch from "../common/OptionSearch";

interface IProps {
    opened: boolean;
    onClose: () => void;
}

export default function VotingCreateModal({ opened, onClose }: IProps) {
    const createVotingMutation = useCreateVoting();
    const { files, handleFileChange } = useFileUpload();

    const form = useForm({
        initialValues: {
            title: "",
            description: "",
            category: "" as VotingCategory,
            assignedGroups: [] as UserGroup[],
            duration: 3,
            type: "classic" as VotingType,
            options: ["Agree", "Disagree"],
            targetUserId: "",
            targetTournamentName: "",
            targetTournamentLink: "",
        },
        validate: {
            title: (value) => (!value ? "Title is required" : null),
            description: (value) => (!value ? "Description is required" : null),
            category: (value) => (!value ? "Category is required" : null),
            assignedGroups: (value) => (value.length === 0 ? "At least one group is required" : null),
            duration: (value) => (value < 1 ? "Duration must be at least 1 day" : null),
            options: (value, values) => {
                if (value.length < 2) return "At least two options are required";
                if (values.type === "binary" && value.length !== 2) {
                    return "Binary votes must have exactly 2 options";
                }
                return null;
            },
            type: (value) => (!value ? "Vote type is required" : null),
            targetUserId: (value, values) => (values.category === "user" && !value ? "Target user is required" : null),
            targetTournamentName: (value, values) => {
                if (values.category === "tournament") {
                    if (!value || !value.trim()) return "Tournament name is required";
                    if (value.length < 5) return "Tournament name must be at least 5 characters";
                    if (value.length > 120) return "Tournament name cannot exceed 120 characters";
                    if (value && !values.targetTournamentLink) return "Forum URL is required for tournament reports";
                }
                return null;
            },
            targetTournamentLink: (value, values) => {
                if (values.category === "tournament") {
                    if (!value) return "Forum URL is required";
                    if (!helpers.isOsuForumLink(value)) return "Invalid osu! forum URL format";
                }
                return null;
            },
        },
    });

    const handleSubmit = form.onSubmit(async (values) => {
        const formData = new FormData() as VotingFormData;

        // Handle arrays and single values differently
        Object.entries(values).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== "") {
                if (Array.isArray(value)) {
                    // For arrays like assignedGroups and options
                    value.forEach((item) => formData.append(key, item));
                } else {
                    // For single values like type, title, etc.
                    formData.append(key, value.toString());
                }
            }
        });

        // Add files
        files.forEach((file) => formData.append("files", file));

        try {
            await createVotingMutation.mutateAsync(formData);
            form.reset();
            onClose();
        } catch (error) {
            console.error("Failed to create vote:", error);
        }
    });

    const handleRemoveOption = (optionToRemove: string) => {
        form.setFieldValue(
            "options",
            form.values.options.filter((option) => option !== optionToRemove)
        );
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

    const typeOptions = [
        { value: "classic", label: "Classic (Single Choice)" },
        { value: "binary", label: "Binary (Yes/No Score)" },
        { value: "variable", label: "Variable (Multiple Scores)" },
    ];

    const presetOptions = [
        { value: "userAddition", label: "User Addition" },
        { value: "tournamentBans", label: "Tournament Ban" },
    ];

    const handlePresetChange = (preset: string) => {
        if (!preset) return;

        const selectedPreset = VOTE_PRESETS[preset as keyof typeof VOTE_PRESETS];
        if (selectedPreset) {
            form.setFieldValue("type", selectedPreset.type);
            form.setFieldValue("options", [...selectedPreset.options]);
        }
    };

    // Set default options
    const setDefaultOptions = useCallback(() => {
        if (form.values.options.length === 0) {
            form.setFieldValue("options", ["Agree", "Disagree"]);
        }
    }, [form]);

    const getVotingMethodDescription = () => {
        switch (form.values.type) {
            case "classic":
                return "Classic voting allows users to select a single option from the provided list.";
            case "binary":
                return "Binary voting allows users to vote between 2 options using a score ranging from -5 to +5, with the green option being +5 and the red option being -5.";
            case "variable":
                return "Variable voting allows users to rate each option with a score ranging from -5 to +5.";
            default:
                return "";
        }
    };
    useEffect(() => {
        if (form.values.type !== form.getInputProps("type").value) {
            setDefaultOptions();
        }
    }, [form, form.values.type, setDefaultOptions]);

    return (
        <Modal opened={opened} onClose={onClose} title="Create New Vote" size="lg">
            <form onSubmit={handleSubmit}>
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
                            allowUserCreation
                        />
                    )}

                    {form.values.category === "tournament" && (
                        <>
                            <TextInput
                                label="Tournament Name"
                                placeholder="Enter tournament name"
                                {...form.getInputProps("targetTournamentName")}
                                withAsterisk
                            />
                            <TextInput
                                label="Tournament Forum URL"
                                placeholder="Enter forum URL"
                                {...form.getInputProps("targetTournamentLink")}
                                withAsterisk
                            />
                        </>
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

                    <Select
                        label="Vote Type"
                        placeholder="Select vote type"
                        data={typeOptions}
                        withAsterisk
                        {...form.getInputProps("type")}
                    />

                    <Select
                        label="Vote Preset"
                        placeholder="Select a preset configuration"
                        data={presetOptions}
                        onChange={(value) => handlePresetChange(value || "")}
                        clearable
                    />

                    <Stack gap="xs">
                        <Text size="sm" fw={500}>
                            Options {form.values.type === "binary" && "(Must be exactly 2)"}
                        </Text>
                        {form.values.type && (
                            <Text size="xs" c="dimmed" fs="italic" mb="xs">
                                {getVotingMethodDescription()}
                            </Text>
                        )}
                        <Group gap="xs">
                            {form.values.options.length === 0 ? (
                                <Text size="xs" c="danger">
                                    No options!
                                </Text>
                            ) : (
                                form.values.options.map((option, index) => (
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
                                ))
                            )}
                        </Group>
                        <OptionSearch
                            options={PREDEFINED_OPTIONS.filter((option) => !form.values.options.includes(option))}
                            onOptionAdd={(option) => {
                                if (!form.values.options.includes(option)) {
                                    form.setFieldValue("options", [...form.values.options, option]);
                                }
                            }}
                            error={form.errors.options}
                            disabled={form.values.type === "binary" && form.values.options.length >= 2}
                        />
                    </Stack>

                    <FileUploadInput value={files} onChange={handleFileChange} />

                    <Group justify="flex-end" mt="md">
                        <Button variant="subtle" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" loading={createVotingMutation.isPending}>
                            Create Vote
                        </Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
}
