import { useCreateTournament } from "../../hooks/useTournaments";
import { Modal, TextInput, Stack, Select, MultiSelect, Button, Group, LoadingOverlay } from "@mantine/core";
import { useForm } from "@mantine/form";
import { DateInput } from "@mantine/dates";
import { GameMode, TournamentType, TournamentStatus, TournamentFormData } from "../../../interfaces/Tournament";
import UserSearch from "../common/UserSearch";
import FileUploadInput from "../common/FileUploadInput";
import { useFileUpload } from "../../hooks/useFileUpload";

interface IProps {
    opened: boolean;
    onClose: () => void;
}

export default function TournamentCreateModal({ opened, onClose }: IProps) {
    const createTournamentMutation = useCreateTournament();
    const { files, handleFileChange } = useFileUpload();

    const form = useForm({
        initialValues: {
            name: "",
            hostId: "",
            modes: [] as GameMode[],
            type: "" as TournamentType,
            status: "" as TournamentStatus,
            bannerUrl: "",
            forumUrl: "",
            startDate: null as Date | null,
            endDate: null as Date | null,
        },
        validate: {
            name: (value) => (!value ? "Name is required" : null),
            hostId: (value) => (!value ? "Host is required" : null),
            modes: (value) => (value.length === 0 ? "At least one game mode is required" : null),
            type: (value) => (!value ? "Type is required" : null),
            forumUrl: (value) => (!value ? "Forum URL is required" : null),
            startDate: (value) => (!value ? "Start date is required" : null),
            endDate: (value, values) => {
                if (!value) return "End date is required";
                if (values.startDate && value < values.startDate) {
                    return "End date must be after start date";
                }
                return null;
            },
        },
    });

    const handleSubmit = async (values) => {
        const formData = new FormData() as TournamentFormData;

        // Handle arrays and single values differently
        Object.entries(values).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== "") {
                if (Array.isArray(value)) {
                    // For arrays like modes
                    value.forEach((item) => formData.append(key, item));
                } else if (value instanceof Date) {
                    // Handle Date objects
                    formData.append(key, value.toISOString());
                } else {
                    // For single values
                    formData.append(key, value.toString());
                }
            }
        });

        // Add files
        files.forEach((file) => formData.append("files", file));

        try {
            await createTournamentMutation.mutateAsync(formData);
            form.reset();
            onClose();
        } catch (error) {
            console.error("Failed to create tournament:", error);
        }
    };

    const modeOptions = [
        { value: "osu", label: "osu!" },
        { value: "taiko", label: "osu!taiko" },
        { value: "catch", label: "osu!catch" },
        { value: "mania", label: "osu!mania" },
    ];

    const typeOptions = [
        { value: "tournament", label: "Tournament" },
        { value: "contest", label: "Contest" },
    ];

    return (
        <Modal opened={opened} onClose={onClose} title="Create New Tournament" size="lg">
            <LoadingOverlay
                visible={createTournamentMutation.isPending}
                zIndex={1000}
                overlayProps={{ radius: "sm", blur: 2 }}
            />

            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack gap="md">
                    <TextInput
                        label="Tournament Name"
                        placeholder="Enter tournament name"
                        {...form.getInputProps("name")}
                        withAsterisk
                    />

                    <UserSearch
                        label="Host"
                        onChange={(user) => form.setFieldValue("hostId", user?.id || "")}
                        error={form.errors.host}
                        required
                        allowUserCreation
                    />

                    <MultiSelect
                        label="Game Modes"
                        placeholder="Select game modes"
                        data={modeOptions}
                        {...form.getInputProps("modes")}
                        withAsterisk
                    />

                    <Select
                        label="Type"
                        placeholder="Select type"
                        data={typeOptions}
                        {...form.getInputProps("type")}
                        withAsterisk
                    />

                    <TextInput
                        label="Forum URL"
                        placeholder="Enter forum post URL"
                        {...form.getInputProps("forumUrl")}
                        withAsterisk
                    />

                    <Group grow>
                        <DateInput
                            label="Start Date"
                            placeholder="Select start date"
                            clearable
                            withAsterisk
                            {...form.getInputProps("startDate")}
                        />
                        <DateInput
                            label="End Date"
                            placeholder="Select end date"
                            clearable
                            withAsterisk
                            minDate={form.values.startDate || undefined}
                            {...form.getInputProps("endDate")}
                        />
                    </Group>

                    <FileUploadInput value={files} onChange={handleFileChange} label="Banner" />

                    <Group justify="flex-end">
                        <Button variant="subtle" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" loading={createTournamentMutation.isPending}>
                            Create Tournament
                        </Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
}
