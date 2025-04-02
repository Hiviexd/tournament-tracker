import { Card, TextInput, Select, Stack, SimpleGrid, Checkbox } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { GameMode, TournamentStatus, TournamentType } from "../../../interfaces/Tournament";
import { IUser } from "../../../interfaces/User";
import UserSearch from "../common/UserSearch";
import { loggedInUserAtom } from "../../store/atoms";
import { useAtom } from "jotai";

interface IProps {
    values: {
        name: string;
        mode: GameMode;
        host: string;
        type: TournamentType | "";
        status: TournamentStatus | "";
        state: string;
        showAllAssignedReviews: boolean;
    };
    onChange: (values: any) => void;
}

export default function TournamentFilters({ values, onChange }: IProps) {
    const [user] = useAtom(loggedInUserAtom);
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
        { value: "screeningOngoing", label: "Screening Ongoing" },
        { value: "screeningConcluded", label: "Screening Concluded" },
        { value: "reviewOngoing", label: "Under Review" },
        { value: "changesRequested", label: "Changes Requested" },
        { value: "badgeApproved", label: "Badge Approved" },
        { value: "badgeRejected", label: "Badge Rejected" },
        { value: "noBadgeRequested", label: "No Badge Requested" },
    ];

    const activeOptions = [
        { value: "active", label: "Active" },
        { value: "concluded", label: "Archived" },
    ];

    return (
        <Card shadow="sm" p="md">
            <Stack gap="md">
                <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
                    <TextInput
                        placeholder="Search by tournament name..."
                        leftSection={<FontAwesomeIcon icon="search" />}
                        value={values.name}
                        onChange={(e) => handleChange("name", e.currentTarget.value)}
                    />
                    <UserSearch
                        placeholder="Search by tournament host..."
                        leftSection={<FontAwesomeIcon icon="user" />}
                        onChange={handleHostSelect}
                    />
                    <Select
                        placeholder="Filter by game mode"
                        leftSection={<FontAwesomeIcon icon="gamepad" />}
                        value={values.mode}
                        onChange={(value) => handleChange("mode", value as GameMode)}
                        data={modeOptions}
                        clearable
                    />
                </SimpleGrid>

                <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
                    <Select
                        placeholder="Filter by type"
                        leftSection={<FontAwesomeIcon icon="trophy" />}
                        value={values.type}
                        onChange={(value) => handleChange("type", value as TournamentType)}
                        data={typeOptions}
                        clearable
                    />
                    <Select
                        placeholder="Filter by status"
                        leftSection={<FontAwesomeIcon icon="list" />}
                        value={values.status}
                        onChange={(value) => handleChange("status", value as TournamentStatus)}
                        data={statusOptions}
                        clearable
                    />
                    <Select
                        placeholder="Filter by state"
                        leftSection={<FontAwesomeIcon icon="clock" />}
                        value={values.state}
                        onChange={(value) => handleChange("state", value)}
                        data={activeOptions}
                        clearable
                    />
                    {user?.isCommittee && (
                        <Checkbox
                            label="Show your all-time assigned reviews"
                            checked={values.showAllAssignedReviews}
                            onChange={(e) => handleChange("showAllAssignedReviews", e.currentTarget.checked)}
                        />
                    )}
                </SimpleGrid>
            </Stack>
        </Card>
    );
}
