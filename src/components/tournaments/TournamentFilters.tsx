import { Card, TextInput, Select, Stack, SimpleGrid, Checkbox, Group, SegmentedControl, Box } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { GameMode, TournamentStatus, TournamentType } from "../../../interfaces/Tournament";
import { IUser } from "../../../interfaces/User";
import UserSearch from "../common/UserSearch";
import { loggedInUserAtom, tournamentViewModeAtom } from "../../store/atoms";
import { useAtom } from "jotai";
import { useLocalPreference } from "../../hooks/useLocalPreferences";

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
    const [viewMode, setViewMode] = useLocalPreference<"cards" | "table" | "review">("tournaments_view_mode", "cards");
    const [, setGlobalViewMode] = useAtom(tournamentViewModeAtom);

    const handleChange = (key: string, value: any) => {
        onChange({ ...values, [key]: value });
    };

    const handleHostSelect = (user: IUser | null) => {
        handleChange("host", user ? user.osuId.toString() : "");
    };

    const handleViewModeChange = (value: string) => {
        const newMode = value as "cards" | "table" | "review";
        setViewMode(newMode);
        setGlobalViewMode(newMode);
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
        {
            group: "Initial Request",
            items: [
                { value: "supportRequestReceived", label: "Support Request Received" },
                { value: "screeningConcluded", label: "Screening Concluded" },
            ],
        },
        {
            group: "Review Process",
            items: [
                { value: "reviewOngoing", label: "Under Review" },
                { value: "onHold", label: "On Hold" },
                { value: "changesRequested", label: "Changes Requested" },
            ],
        },
        {
            group: "Consensus",
            items: [
                { value: "badgeApproved", label: "Badge Approved" },
                { value: "badgeRejected", label: "Badge Rejected" },
                { value: "noBadgeRequested", label: "No Badge Requested" },
            ],
        },
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
                        disabled={viewMode === "review"}
                    />
                    <Select
                        placeholder="Filter by status"
                        leftSection={<FontAwesomeIcon icon="list" />}
                        value={values.status}
                        onChange={(value) => handleChange("status", value as TournamentStatus)}
                        data={statusOptions}
                        clearable
                        disabled={viewMode === "review"}
                    />
                    <Select
                        placeholder="Filter by state"
                        leftSection={<FontAwesomeIcon icon="clock" />}
                        value={values.state}
                        onChange={(value) => handleChange("state", value)}
                        data={activeOptions}
                        clearable
                        disabled={viewMode === "review"}
                    />
                </SimpleGrid>

                <Group justify="space-between" align="center">
                    <Box>
                        {user?.isCommittee && (
                            <Checkbox
                                label="Show your all-time assigned reviews"
                                checked={values.showAllAssignedReviews}
                                onChange={(e) => handleChange("showAllAssignedReviews", e.currentTarget.checked)}
                                disabled={viewMode === "review"}
                            />
                        )}
                    </Box>
                    <SegmentedControl
                        color="primary"
                        withItemsBorders={false}
                        value={viewMode}
                        onChange={handleViewModeChange}
                        data={[
                            { label: "Cards", value: "cards" },
                            { label: "Table", value: "table" },
                            ...(user?.isCommittee ? [{ label: "Review Board", value: "review" }] : []),
                        ]}
                    />
                </Group>
            </Stack>
        </Card>
    );
}
