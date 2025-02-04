import { Card, TextInput, Group, Select, Stack } from "@mantine/core";
import { GameMode, TournamentType, TournamentStatus } from "../../../interfaces/Tournament";
import { IUser } from "../../../interfaces/User";
import UserSearch from "../common/UserSearch";

interface IProps {
    values: {
        name: string;
        mode: GameMode;
        host: string;
        type: TournamentType | "";
        status: TournamentStatus | "";
        state: string;
    };
    onChange: (values: any) => void;
}

export default function TournamentFilters({ values, onChange }: IProps) {
    const handleChange = (key: string, value: any) => {
        onChange({ ...values, [key]: value });
    };

    const handleHostSelect = (user: IUser | null) => {
        handleChange("host", user ? user.osuId.toString() : "");
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

    const statusOptions = [
        { value: "supportRequestReceived", label: "Support Request Received" },
        { value: "screeningConcluded", label: "Screening Concluded" },
        { value: "reviewOngoing", label: "Review Ongoing" },
        { value: "changesRequested", label: "Changes Requested" },
        { value: "badgeApproved", label: "Badge Approved" },
        { value: "badgeRejected", label: "Badge Rejected" },
    ];

    const activeOptions = [
        { value: "active", label: "Active" },
        { value: "concluded", label: "Concluded" },
    ];

    return (
        <Card shadow="sm" p="md">
            <Stack gap="md">
                <Group grow>
                    <TextInput
                        placeholder="Search by name..."
                        value={values.name}
                        onChange={(e) => handleChange("name", e.currentTarget.value)}
                    />
                    <UserSearch label="" onChange={handleHostSelect} width="100%" />
                    <Select
                        placeholder="Game mode"
                        value={values.mode}
                        onChange={(value) => handleChange("mode", value as GameMode)}
                        data={modeOptions}
                        clearable
                    />
                </Group>
                <Group grow>
                    <Select
                        placeholder="Type"
                        value={values.type}
                        onChange={(value) => handleChange("type", value as TournamentType)}
                        data={typeOptions}
                        clearable
                    />
                    <Select
                        placeholder="Status"
                        value={values.status}
                        onChange={(value) => handleChange("status", value as TournamentStatus)}
                        data={statusOptions}
                        clearable
                    />
                    <Select
                        placeholder="State"
                        value={values.state}
                        onChange={(value) => handleChange("state", value)}
                        data={activeOptions}
                        clearable
                    />
                </Group>
            </Stack>
        </Card>
    );
}
