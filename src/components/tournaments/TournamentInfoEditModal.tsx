import { useState } from "react";
import { Modal, TextInput, Stack, Select, Button, Group, LoadingOverlay } from "@mantine/core";
import { useForm } from "@mantine/form";
import MultiSelect from "../common/MultiSelect";
import { ITournament } from "../../../interfaces/Tournament";
import { IUser } from "../../../interfaces/User";
import MultipleUsersInput from "../common/MultipleUsersInput";
import utils from "../../../utils";
import { useEditTournament } from "../../hooks/useTournaments";
import { useAtom } from "jotai";
import { loggedInUserAtom } from "../../store/atoms";

interface IProps {
    tournament: ITournament;
    opened: boolean;
    onClose: () => void;
}

export default function TournamentInfoEditModal({ tournament, opened, onClose }: IProps) {
    const [user] = useAtom(loggedInUserAtom);
    const editTournamentMutation = useEditTournament(tournament.id);
    const [selectedHosts, setSelectedHosts] = useState<IUser[]>(tournament.hosts || []);

    const form = useForm({
        initialValues: {
            name: tournament.name,
            hostIds: tournament.hosts.map((h) => h.id),
            modes: tournament.modes,
            type: tournament.type,
        },
        validate: {
            name: (value) => {
                if (!value) return "Name is required";
                if (!utils.isLatinScriptOnly(value)) return "Name must be in Latin script (no Cyrillic, Chinese, etc.)";
                return null;
            },
            hostIds: (value) => (value.length === 0 ? "At least one host is required" : null),
            modes: (value) => (value.length === 0 ? "At least one game mode is required" : null),
            type: (value) => (!value ? "Type is required" : null),
        },
    });

    const handleHostsChange = (hosts: IUser[]) => {
        setSelectedHosts(hosts);
        form.setFieldValue(
            "hostIds",
            hosts.map((h) => h.id)
        );
    };

    const handleSubmit = async (values) => {
        try {
            const payload = { ...values };

            // Only send modes and type if user is admin
            if (!user?.isAdmin) {
                delete payload.modes;
                delete payload.type;
            }

            await editTournamentMutation.mutateAsync(payload);
            onClose();
        } catch (error) {
            console.error("Failed to edit tournament:", error);
        }
    };

    const handleClose = () => {
        form.reset();
        setSelectedHosts(tournament.hosts || []);
        onClose();
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
        <Modal opened={opened} onClose={handleClose} title="Edit Tournament Info" size="lg">
            <LoadingOverlay
                visible={editTournamentMutation.isPending}
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

                    <MultipleUsersInput
                        value={selectedHosts}
                        onChange={handleHostsChange}
                        label="Hosts"
                        placeholder="Search for a host to add..."
                        required
                        error={form.errors.hostIds as string}
                        allowUserCreation
                        showActiveInfringementWarning
                    />

                    <MultiSelect
                        label="Game Modes"
                        placeholder="Select game modes"
                        data={modeOptions}
                        {...form.getInputProps("modes")}
                        withAsterisk
                        disabled={!user?.isAdmin}
                        description={!user?.isAdmin ? "Only admins can change game modes" : undefined}
                    />

                    <Select
                        label="Type"
                        placeholder="Select type"
                        data={typeOptions}
                        {...form.getInputProps("type")}
                        withAsterisk
                        disabled={!user?.isAdmin}
                        description={!user?.isAdmin ? "Only admins can change tournament type" : undefined}
                    />

                    <Group justify="flex-end">
                        <Button variant="subtle" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            loading={editTournamentMutation.isPending}
                            disabled={selectedHosts.some((host) => host.activeInfringement)}>
                            Save Changes
                        </Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
}
