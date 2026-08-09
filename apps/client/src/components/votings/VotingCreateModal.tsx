// Base
import { useCreateVoting } from "../../hooks/useVotings";
import { VotingCategory, type VotingFormData, VotingType } from "@tc/types/Voting";
import { UserGroup } from "@tc/types/User";
import { VOTE_COLORS, PREDEFINED_OPTIONS, VOTE_PRESETS } from "../../constants";
import { useFileUpload } from "../../hooks/useFileUpload";
import utils from "@tc/utils/client";
import { clearAutoSavedValue } from "../../hooks/useAutoSave";

//Mantine
import MultiSelect from "../common/MultiSelect";
import { Modal, TextInput, Stack, Select, NumberInput, Button, Group, Pill, Text, Box, Checkbox } from "@mantine/core";
import { useForm } from "@mantine/form";

// Components
import UserSearch from "../common/UserSearch";
import FileUploadInput from "../common/FileUploadInput";
import OptionSearch from "../common/OptionSearch";
import TextEditor from "../common/TextEditor";
import { useNavigate } from "react-router";

interface IProps {
    opened: boolean;
    onClose: () => void;
}

export default function VotingCreateModal({ opened, onClose }: IProps) {
    const createVotingMutation = useCreateVoting();
    const { files, handleFileChange } = useFileUpload();
    const autoSaveKey = "voting-create-description";
    const navigate = useNavigate();

    const form = useForm({
        initialValues: {
            title: "",
            description: "",
            category: "" as VotingCategory,
            assignedGroups: [] as UserGroup[],
            duration: 3,
            type: "classic" as VotingType,
            options: ["Support", "Oppose"],
            allowNeutralVotes: true,
            targetUserId: "",
            targetTournamentName: "",
            targetTournamentLink: "",
            forceFullParticipation: false,
            binaryStrictPassThreshold: 50,
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
                if (values.type === "binary-strict" && value.length !== 2) {
                    return "Binary strict votes must have exactly 2 options";
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
                    if (!utils.isOsuForumLink(value)) return "Invalid osu! forum URL format";
                }
                return null;
            },
        },
    });

    const handleSubmit = async (values) => {
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
            const res = await createVotingMutation.mutateAsync(formData);

            // Clear autosaved content after successful submission
            clearAutoSavedValue(autoSaveKey);

            form.reset();
            onClose();

            navigate(`/votes/${res.voting._id}`);
        } catch (error) {
            console.error("Failed to create voting:", error);
        }
    };

    const handleRemoveOption = (optionToRemove: string) => {
        form.setFieldValue(
            "options",
            form.values.options.filter((option) => option !== optionToRemove),
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
        {
            group: "Clear Outcome Voting (for decisions)",
            items: [
                { value: "classic", label: "Classic (Single Choice)" },
                { value: "binary-strict", label: "Strict Binary (Support/Oppose)" },
                { value: "ranked-choice", label: "Ranked Choice (Schulze Method)" },
            ],
        },
        {
            group: "Score-based Voting (for vibe checks)",
            items: [
                { value: "binary", label: "Binary (Yes/No Score)" },
                { value: "variable", label: "Variable (Multiple Scores)" },
            ],
        },
    ];

    const presetOptions = [
        { value: "userAddition", label: "User Addition" },
        { value: "tournamentBans", label: "Tournament Ban" },
        { value: "badgeSupport", label: "Badge Support" },
        { value: "topThreeBadgeSupport", label: "Top 3 Badge Support" },
    ];

    const handlePresetChange = (preset: string) => {
        if (!preset) return;

        const selectedPreset = VOTE_PRESETS[preset as keyof typeof VOTE_PRESETS];
        if (selectedPreset) {
            form.setFieldValue("type", selectedPreset.type);
            form.setFieldValue("options", [...selectedPreset.options]);
            form.setFieldValue("duration", selectedPreset.duration);
            form.setFieldValue("allowNeutralVotes", selectedPreset.allowNeutralVotes);
            form.setFieldValue("forceFullParticipation", selectedPreset.forceFullParticipation);
            form.setFieldValue("binaryStrictPassThreshold", selectedPreset.binaryStrictPassThreshold);
        }
    };

    const setDefaultOptionsForType = (type: VotingType, skipIfCustomOptions = false) => {
        if (type === "binary-strict") {
            if (skipIfCustomOptions) {
                const currentOptions = form.values.options;
                const isDefaultTwoOptions =
                    currentOptions.length === 2 && currentOptions.join(",") === "Support,Oppose";
                if (!isDefaultTwoOptions && currentOptions.length > 0) {
                    return; // Don't override custom options
                }
            }
            form.setFieldValue("options", ["Support", "Oppose"]);
        } else if (form.values.options.length === 0) {
            form.setFieldValue("options", ["Support", "Oppose"]);
        }
    };

    const handleTypeChange = (value: string | null) => {
        if (value) {
            const newType = value as VotingType;
            form.setFieldValue("type", newType);
            setDefaultOptionsForType(newType, true);
        }
    };

    const handleAllowNeutralVotesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = event.currentTarget.checked;
        form.setFieldValue("allowNeutralVotes", newValue);
        setDefaultOptionsForType(form.values.type, true);
    };

    const getVotingMethodDescription = () => {
        switch (form.values.type) {
            case "classic":
                return "Classic voting allows users to select a single option from the provided list.";
            case "binary":
                return "Binary voting allows users to vote between 2 options using a score ranging from -5 to +5, with the green option being +5 and the red option being -5.";
            case "binary-strict":
                return "Binary strict voting presents 2 options: Support and Oppose.";
            case "variable":
                return "Variable voting allows users to rate each option with a score ranging from -5 to +5.";
            case "ranked-choice":
                return "Ranked choice voting allows users to rate each option on a 5-point scale from strongly disagree to strongly agree. Results are calculated using the Schulze method.";
            default:
                return "";
        }
    };

    return (
        <Modal opened={opened} onClose={onClose} title="Create New Vote" size="xl">
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack gap="md">
                    <TextInput
                        label="Title"
                        placeholder="Enter vote title"
                        withAsterisk
                        {...form.getInputProps("title")}
                    />

                    <Box>
                        <Box mb={5} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <Box component="label" style={{ fontWeight: 500, fontSize: "14px" }}>
                                Description<span style={{ color: "var(--mantine-color-red-filled)" }}> *</span>
                            </Box>
                        </Box>
                        <TextEditor
                            value={form.values.description}
                            onChange={(value) => form.setFieldValue("description", value)}
                            className={form.errors.description ? "error" : ""}
                            autoSaveKey={autoSaveKey}
                        />
                        {form.errors.description && (
                            <Box mt={5} style={{ color: "var(--mantine-color-red-filled)", fontSize: "12px" }}>
                                {form.errors.description}
                            </Box>
                        )}
                    </Box>

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
                            onChange={(value) => form.setFieldValue("targetUserId", value?.id || "")}
                            error={form.errors.targetUserId}
                            required
                            allowUserCreation
                        />
                    )}

                    {form.values.category === "tournament" && (
                        <>
                            <TextInput
                                label="Tournament Name"
                                placeholder="Enter tournament name..."
                                {...form.getInputProps("targetTournamentName")}
                                withAsterisk
                            />
                            <TextInput
                                label="Tournament Forum URL"
                                placeholder="https://osu.ppy.sh/community/forums/topics/..."
                                {...form.getInputProps("targetTournamentLink")}
                                withAsterisk
                            />
                        </>
                    )}

                    <MultiSelect
                        label="Assigned Group(s)"
                        placeholder="Select assigned group(s)"
                        data={groupOptions}
                        withAsterisk
                        {...form.getInputProps("assignedGroups")}
                    />

                    <Checkbox
                        label="Force full participation"
                        description="Raises the participation requirement from 75% to 100%"
                        checked={form.values.forceFullParticipation}
                        onChange={(event) => form.setFieldValue("forceFullParticipation", event.currentTarget.checked)}
                    />

                    <NumberInput
                        label="Duration (days)"
                        placeholder="Enter duration in days"
                        withAsterisk
                        min={1}
                        {...form.getInputProps("duration")}
                    />

                    <Select
                        label="Vote Preset"
                        placeholder="Select a preset configuration"
                        data={presetOptions}
                        onChange={(value) => handlePresetChange(value || "")}
                        clearable
                    />

                    <Select
                        label="Vote Type"
                        placeholder="Select vote type"
                        data={typeOptions}
                        withAsterisk
                        value={form.values.type}
                        onChange={handleTypeChange}
                        error={form.errors.type}
                    />

                    {(form.values.type === "binary" || form.values.type === "variable") && (
                        <Checkbox
                            label="Allow neutral votes"
                            checked={form.values.allowNeutralVotes}
                            onChange={handleAllowNeutralVotesChange}
                        />
                    )}

                    {form.values.type === "binary-strict" && (
                        <NumberInput
                            label="Pass threshold"
                            placeholder="Enter pass threshold"
                            suffix="%"
                            min={0}
                            max={100}
                            defaultValue={50}
                            withAsterisk
                            {...form.getInputProps("binaryStrictPassThreshold")}
                        />
                    )}

                    <Stack gap="xs">
                        <Text size="sm" fw={500}>
                            Options{" "}
                            {(form.values.type === "binary" || form.values.type === "binary-strict") &&
                                "(must be exactly 2)"}
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
                                        withRemoveButton={form.values.type !== "binary-strict"}
                                        onRemove={() => handleRemoveOption(option)}
                                        variant="subtle"
                                        style={{
                                            backgroundColor: `color-mix(in srgb, ${
                                                VOTE_COLORS[index % VOTE_COLORS.length]
                                            } 15%, transparent)`,
                                            color: VOTE_COLORS[index % VOTE_COLORS.length],
                                            transition:
                                                "border-color 0.2s ease, background-color 0.2s ease, opacity 0.2s ease",
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
                            disabled={
                                (form.values.type === "binary" && form.values.options.length >= 2) ||
                                (form.values.type === "binary-strict" && form.values.options.length >= 2)
                            }
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
