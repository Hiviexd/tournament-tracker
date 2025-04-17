import { useCreateTournament } from "../../hooks/useTournaments";
import { Modal, TextInput, Stack, Select, MultiSelect, Button, Group, LoadingOverlay } from "@mantine/core";
import { useForm } from "@mantine/form";
import { DateInput } from "@mantine/dates";
import { GameMode, TournamentType, TournamentStatus } from "../../../interfaces/Tournament";
import UserSearch from "../common/UserSearch";
import utils from "../../../utils";

interface IProps {
    opened: boolean;
    onClose: () => void;
}

export default function TournamentCreateModal({ opened, onClose }: IProps) {
    const createTournamentMutation = useCreateTournament();

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
            forumUrl: (value) => {
                if (value && !utils.isOsuForumLink(value)) return "Invalid osu! forum URL";
            },
            bannerUrl: (value) => {
                if (value && !utils.isValidUrl(value)) return "Invalid URL";
            },
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
        try {
            await createTournamentMutation.mutateAsync(values);
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
                        placeholder="Enter tournament name..."
                        {...form.getInputProps("name")}
                        withAsterisk
                    />

                    <UserSearch
                        label="Host"
                        onChange={(user) => form.setFieldValue("hostId", user?.id || "")}
                        error={form.errors.hostId}
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
                        placeholder="Enter forum post URL..."
                        {...form.getInputProps("forumUrl")}
                    />

                    <TextInput
                        label="Banner URL"
                        placeholder="Enter banner image URL..."
                        {...form.getInputProps("bannerUrl")}
                    />

                    <TextInput
                        label="Enchant URL"
                        placeholder="Enter enchant ticket URL..."
                        {...form.getInputProps("enchantUrl")}
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
