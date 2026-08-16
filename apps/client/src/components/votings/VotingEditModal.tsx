// Base
import { useState } from "react";
import { useUpdateVoting, useRecalibrateRequiredVotes } from "../../hooks/useVotings";
import { IVoting, SANCTION_BAN_TYPES } from "@tc/types/Voting";
import { IUser } from "@tc/types/User";
import { VOTE_COLORS } from "../../constants";
import startCase from "lodash/startCase.js";
import { clearAutoSavedValue } from "../../hooks/useAutoSave";
import utils, { isString } from "@tc/utils/client";

// Mantine
import {
    Modal,
    TextInput,
    Stack,
    NumberInput,
    Button,
    Group,
    ActionIcon,
    Text,
    Pill,
    Box,
    Checkbox,
    Select,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import TextEditor from "../common/TextEditor";
import MultipleUsersInput from "../common/MultipleUsersInput";
import { useConfirmModal } from "../../hooks/useModals";

interface IProps {
    voting: IVoting;
    opened: boolean;
    onClose: () => void;
}

export default function VotingEditModal({ voting, opened, onClose }: IProps) {
    const updateVotingMutation = useUpdateVoting(voting.id);
    const recalibrateMutation = useRecalibrateRequiredVotes(voting.id);
    const confirmModal = useConfirmModal();
    const [newOption, setNewOption] = useState("");
    const [editorKey, setEditorKey] = useState(0);
    const [selectedUsers, setSelectedUsers] = useState<IUser[]>(voting.targetUsers || []);
    const hasVotes = voting.votes.length > 0;
    const privateDescriptionAutoSaveKey = `voting-edit-private-description-${voting._id}`;
    const publicDescriptionAutoSaveKey = `voting-edit-public-description-${voting._id}`;
    const sanctionPostAutoSaveKey = `voting-edit-sanction-post-${voting._id}`;

    const form = useForm({
        initialValues: {
            title: voting.title,
            description: voting.description,
            publicDescription: voting.publicDescription || "",
            duration: voting.duration,
            options: [...voting.options],
            type: voting.type,
            allowNeutralVotes: voting.allowNeutralVotes,
            category: voting.category,
            targetUserIds: voting.targetUsers?.map((user) => user.id) || [],
            targetTournamentName: voting.targetTournamentName || "",
            targetTournamentLink: voting.targetTournamentLink || "",
            sanctionType: voting.sanctionType || "",
            sanctionPost: voting.sanctionPost || "",
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
                if (voting.type === "binary-strict") {
                    if (form.values.allowNeutralVotes && value.length !== 3) {
                        return "Binary strict votes with neutral allowed must have exactly 3 options";
                    }
                    if (!form.values.allowNeutralVotes && value.length !== 2) {
                        return "Binary strict votes without neutral must have exactly 2 options";
                    }
                }
                return null;
            },
            category: (value) => (!value ? "Category is required" : null),
            targetUserIds: (value, values) =>
                values.category === "user" && value.length === 0 ? "At least one target user is required" : null,
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
            sanctionType: (value) =>
                voting.isSanctionVote && !voting.sanctionAppliedAt && !value ? "Sanction type is required" : null,
            sanctionPost: (value) => {
                if (!voting.isSanctionVote || voting.sanctionAppliedAt) return null;
                if (!value.trim()) return "Sanction post is required";
                if (value.trim().length > 1000) return "Sanction post cannot exceed 1000 characters";
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
            clearAutoSavedValue(sanctionPostAutoSaveKey);

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
            form.values.options.filter((option) => option !== optionToRemove),
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

    const handleRecalibrateRequiredVotes = async () => {
        if (
            !(await confirmModal({
                title: "Recalibrate Required Votes?",
                text: "Recalculate required votes from the current active-voter roster?",
                confirmText: "Recalibrate",
                confirmProps: {
                    leftSection: <FontAwesomeIcon icon="arrows-rotate" />,
                    color: "blue",
                },
            }))
        )
            return;
        await recalibrateMutation.mutateAsync();
    };

    const categoryOptions = [
        { value: "discussion", label: "Discussion" },
        { value: "tournament", label: "Tournament" },
        { value: "user", label: "User" },
    ];

    return (
        <Modal opened={opened} onClose={onClose} title="Edit Vote" size="xl">
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

                    {voting.isSanctionVote && !voting.sanctionAppliedAt && (
                        <>
                            <Select
                                label="Sanction type"
                                placeholder="Select sanction type"
                                data={SANCTION_BAN_TYPES.map((type) => ({
                                    value: type,
                                    label: startCase(type),
                                }))}
                                withAsterisk
                                allowDeselect={false}
                                {...form.getInputProps("sanctionType")}
                            />
                            <Box>
                                <Box
                                    mb={5}
                                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <Box component="label" style={{ fontWeight: 500, fontSize: "14px" }}>
                                        Sanction post
                                        <span style={{ color: "var(--mantine-color-red-filled)" }}> *</span>
                                    </Box>
                                    <Text size="xs" c="dimmed">
                                        {form.values.sanctionPost.trim().length}/1000
                                    </Text>
                                </Box>
                                <TextEditor
                                    value={form.values.sanctionPost}
                                    onChange={(value) => form.setFieldValue("sanctionPost", value)}
                                    placeholder="Official reason sent to the user and stored on the watchlist"
                                    className={form.errors.sanctionPost ? "error" : ""}
                                    autoSaveKey={sanctionPostAutoSaveKey}
                                />
                                {form.errors.sanctionPost && (
                                    <Box mt={5} style={{ color: "var(--mantine-color-red-filled)", fontSize: "12px" }}>
                                        {form.errors.sanctionPost}
                                    </Box>
                                )}
                            </Box>
                        </>
                    )}

                    {!voting.isActive && (
                        <Select
                            label="Category"
                            placeholder="Select vote category"
                            data={categoryOptions}
                            withAsterisk
                            disabled={voting.isSanctionVote}
                            {...form.getInputProps("category")}
                        />
                    )}

                    {(!voting.isActive || voting.isSanctionVote) && form.values.category === "user" && (
                        <MultipleUsersInput
                            value={selectedUsers}
                            onChange={(users) => {
                                setSelectedUsers(users);
                                form.setFieldValue(
                                    "targetUserIds",
                                    users.map((user) => user.id),
                                );
                            }}
                            label="Target Users"
                            placeholder="Search for a user to add..."
                            required
                            error={isString(form.errors.targetUserIds) ? form.errors.targetUserIds : undefined}
                            allowUserCreation
                            disabled={voting.isSanctionVote && !voting.isActive}
                            showActiveInfringementWarning
                        />
                    )}

                    {!voting.isActive && form.values.category === "tournament" && (
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
                    <Box>
                        {voting.isActive && (
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
                        )}
                        <Box mt={10} style={{ display: "flex", gap: 5, alignItems: "center" }}>
                            <Box component="label" style={{ fontWeight: 500, fontSize: "14px" }}>
                                Public Description
                            </Box>
                            <Button size="xs" variant="subtle" onClick={handleLoadPrivateDescription}>
                                Load private description
                            </Button>
                        </Box>
                        <Text size="xs" c="dimmed" mb="md">
                            This description will be shown to the public after the vote is concluded and published.
                        </Text>
                        <TextEditor
                            key={editorKey}
                            value={form.values.publicDescription}
                            onChange={(value) => form.setFieldValue("publicDescription", value)}
                            placeholder="Enter public description"
                            minHeight={120}
                            className={form.errors.publicDescription ? "error" : ""}
                            autoSaveKey={publicDescriptionAutoSaveKey}
                            style={{ flex: "1 1 auto", minHeight: 120 }}
                        />
                        {form.errors.publicDescription && (
                            <Box mt={5} style={{ color: "var(--mantine-color-red-filled)", fontSize: "12px" }}>
                                {form.errors.publicDescription}
                            </Box>
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

                            <Group justify="space-between" align="center">
                                <Text size="sm">
                                    Required votes:{" "}
                                    <Text span fw={600}>
                                        {voting.requiredVotes}
                                    </Text>
                                </Text>
                                <Button
                                    type="button"
                                    variant="outline"
                                    color="blue"
                                    onClick={handleRecalibrateRequiredVotes}
                                    loading={recalibrateMutation.isPending}
                                    leftSection={<FontAwesomeIcon icon="arrows-rotate" />}>
                                    Recalibrate
                                </Button>
                            </Group>

                            <Stack gap="xs">
                                <Group justify="space-between">
                                    <Text size="sm" fw={500}>
                                        Options {voting.type === "binary" && "(Must be exactly 2)"}
                                        {voting.type === "variable" && "(Each will be rated -5 to +5)"}
                                    </Text>
                                    {(hasVotes || voting.type === "binary-strict") && (
                                        <Text size="xs" c="dimmed">
                                            {hasVotes && "Options cannot be modified after votes are cast"}
                                            {!hasVotes &&
                                                voting.type === "binary-strict" &&
                                                "Options are fixed for binary strict votes"}
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
                                                    transition:
                                                        "border-color 0.2s ease, background-color 0.2s ease, opacity 0.2s ease",
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
                                            disabled={
                                                (form.values.type === "binary" && form.values.options.length >= 2) ||
                                                form.values.type === "binary-strict"
                                            }
                                        />
                                        <ActionIcon
                                            variant="filled"
                                            color="primary"
                                            onClick={handleAddOption}
                                            disabled={
                                                !newOption.trim() ||
                                                (form.values.type === "binary" && form.values.options.length >= 2) ||
                                                form.values.type === "binary-strict"
                                            }>
                                            <FontAwesomeIcon icon="plus" />
                                        </ActionIcon>
                                    </Group>
                                )}
                            </Stack>
                        </>
                    )}

                    {(form.values.type === "binary" || form.values.type === "variable") && (
                        <Checkbox
                            label="Allow neutral votes"
                            checked={form.values.allowNeutralVotes}
                            onChange={(event) => form.setFieldValue("allowNeutralVotes", event.currentTarget.checked)}
                        />
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
