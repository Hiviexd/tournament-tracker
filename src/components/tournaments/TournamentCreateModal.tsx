import { useState } from "react";
import { useCreateTournament } from "../../hooks/useTournaments";
import { Modal, TextInput, Stack, Select, MultiSelect, Button, Group, LoadingOverlay, TagsInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { DateInput } from "@mantine/dates";
import { GameMode, TournamentType, TournamentStatus } from "../../../interfaces/Tournament";
import UserSearch from "../common/UserSearch";
import utils from "../../../utils";
import { useNavigate } from "react-router";
import AlertText from "../common/AlertText";
import { IUser } from "../../../interfaces/User";

interface IProps {
    opened: boolean;
    onClose: () => void;
}

export default function TournamentCreateModal({ opened, onClose }: IProps) {
    const createTournamentMutation = useCreateTournament();
    const [selectedHost, setSelectedHost] = useState<IUser | null>(null);
    const navigate = useNavigate();

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
            enchantUrl: "",
            tags: [] as string[],
        },
        validate: {
            name: (value) => {
                if (!value) return "Name is required";
                if (!utils.isLatinScriptOnly(value)) return "Name must be in Latin script (no Cyrillic, Chinese, etc.)";
                return null;
            },
            hostId: (value) => (!value ? "Host is required" : null),
            modes: (value) => (value.length === 0 ? "At least one game mode is required" : null),
            type: (value) => (!value ? "Type is required" : null),
            forumUrl: (value) => {
                if (value && !utils.isOsuForumLink(value)) return "Invalid osu! forum URL";
            },
            bannerUrl: (value) => {
                if (value && !utils.isValidUrl(value)) return "Invalid URL";
            },
            enchantUrl: (value) => {
                if (value && !utils.isEnchantTicketLink(value)) return "Invalid Enchant ticket URL";
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

    const handleSelectHost = (host: IUser | null) => {
        setSelectedHost(host);
        form.setFieldValue("hostId", host?.id || "");
    };

    const handleSubmit = async (values) => {
        try {
            const res = await createTournamentMutation.mutateAsync(values);
            form.reset();
            onClose();
            navigate(`/tournaments/${res.tournament._id}`);
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

                    <Stack gap="xs">
                        <UserSearch
                            label="Host"
                            onChange={(user) => handleSelectHost(user || null)}
                            error={form.errors.hostId}
                            required
                            allowUserCreation
                        />

                        {selectedHost?.activeInfringement && (
                            <AlertText size="xs" type="danger">
                                {selectedHost.username} has an{" "}
                                {selectedHost.activeInfringement.isIndefinite ? "indefinite" : "active"}{" "}
                                {selectedHost.activeInfringement.typeString}!
                            </AlertText>
                        )}
                    </Stack>

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

                    <TagsInput
                        label="Search Tags"
                        placeholder="Enter tags..."
                        description="Press enter to add a tag"
                        {...form.getInputProps("tags")}
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
                        <Button
                            type="submit"
                            loading={createTournamentMutation.isPending}
                            disabled={!!selectedHost?.activeInfringement}>
                            Create Tournament
                        </Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
}
