import { Card, TextInput, Select, Stack, SimpleGrid, Checkbox, Group, SegmentedControl, Box } from "@mantine/core";
import { useDebouncedCallback, useIsFirstRender } from "@mantine/hooks";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { GameMode, TournamentStatus, TournamentType } from "../../../interfaces/Tournament";
import { IUser } from "../../../interfaces/User";
import UserSearch from "../common/UserSearch";
import TournamentStatusSelect from "../common/TournamentStatusSelect";
import { loggedInUserAtom, tournamentViewModeAtom } from "../../store/atoms";
import { useAtom } from "jotai";
import { useLocalPreference } from "../../hooks/useLocalPreferences";

interface IProps {
    values: {
        search: string;
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
    const isFirstRender = useIsFirstRender();

    // Local state for immediate UI updates
    const [searchInput, setSearchInput] = useState(values.search);

    // Debounced onChange handler
    const debouncedOnChange = useDebouncedCallback((newValues: typeof values) => {
        onChange(newValues);
    }, 400);

    const handleChange = (key: string, value: any) => {
        onChange({ ...values, [key]: value });
    };

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = event.currentTarget.value;
        setSearchInput(newValue); // Update input immediately
        debouncedOnChange({ ...values, search: newValue }); // Debounce the onChange call
    };

    const handleHostSelect = (user: IUser | null) => {
        handleChange("host", user ? user.osuId.toString() : "");
    };

    // Preload user from host query on first render
    const preloadUser = isFirstRender && values.host ? values.host : undefined;

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

    const stateOptions = [
        { value: "all", label: "All Tournaments" },
        { value: "archived", label: "Archived" },
    ];

    return (
        <Card shadow="sm" p="md">
            <Stack gap="md">
                <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
                    <TextInput
                        placeholder="Search by name or tags..."
                        leftSection={<FontAwesomeIcon icon="search" />}
                        value={searchInput}
                        onChange={handleSearchChange}
                    />
                    <UserSearch
                        placeholder="Search by tournament host..."
                        leftSection={<FontAwesomeIcon icon="user" />}
                        onChange={handleHostSelect}
                        preloadUser={preloadUser}
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
                    <TournamentStatusSelect
                        value={values.status}
                        leftSection={<FontAwesomeIcon icon="list" />}
                        onChange={(value) => handleChange("status", value)}
                        placeholder="Filter by status"
                        searchable
                        clearable
                        disabled={viewMode === "review"}
                    />
                    <Select
                        placeholder="Filter by state"
                        leftSection={<FontAwesomeIcon icon="clock" />}
                        value={values.state}
                        onChange={(value) => handleChange("state", value)}
                        data={stateOptions}
                        clearable
                        disabled={viewMode === "review"}
                    />
                </SimpleGrid>

                <Group justify="space-between" align="center">
                    <Box>
                        {user?.isCommittee && (
                            <Checkbox
                                label="Filter to assigned reviews"
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
