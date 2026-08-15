import { Card, TextInput, Select, Stack, Alert, Checkbox, SimpleGrid } from "@mantine/core";
import { useDebouncedCallback } from "@mantine/hooks";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { UserGroup } from "@tc/types/User";
import UserSearch from "../common/UserSearch";
import { useAtom } from "jotai";
import { loggedInUserAtom } from "../../store/atoms";

interface FilterValues {
    title: string;
    content: string;
    targetUser: string;
    targetTournament: string;
    assignedGroup: UserGroup | "";
    status: string;
    showOwn: boolean;
}

interface IProps {
    values: FilterValues;
    onChange: (values: FilterValues) => void;
    type: "ticket" | "report";
}

export default function TicketsFilters({ values, onChange, type }: IProps) {
    const [user] = useAtom(loggedInUserAtom);

    // Local state for debounced inputs (for immediate UI updates)
    const [titleInput, setTitleInput] = useState(values.title);
    const [contentInput, setContentInput] = useState(values.content);
    const [tournamentInput, setTournamentInput] = useState(values.targetTournament);

    // Debounced onChange handler
    const debouncedOnChange = useDebouncedCallback((newValues: FilterValues) => {
        onChange(newValues);
    }, 400);

    const assignedGroupOptions = [
        { value: "tc", label: "Tournament Committee" },
        { value: "cc", label: "Contest Committee" },
    ] as const;

    const statusOptions = [
        { value: "active", label: "Active" },
        { value: "closed", label: "Closed" },
    ] as const;

    const handleChange = (key: keyof FilterValues, value: any) => {
        onChange({ ...values, [key]: value });
    };

    const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = event.currentTarget.value;
        setTitleInput(newValue); // Update input immediately
        debouncedOnChange({ ...values, title: newValue }); // Debounce the onChange call
    };

    const handleContentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = event.currentTarget.value;
        setContentInput(newValue); // Update input immediately
        debouncedOnChange({ ...values, content: newValue }); // Debounce the onChange call
    };

    const handleTournamentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = event.currentTarget.value;
        setTournamentInput(newValue); // Update input immediately
        debouncedOnChange({ ...values, targetTournament: newValue }); // Debounce the onChange call
    };

    // Non-committee users viewing reports
    if (type === "report" && !user?.isCommitteeOrAdmin) {
        return (
            <Alert color="info" title="Note" icon={<FontAwesomeIcon icon="info-circle" />}>
                Below is a list of all of your submitted reports.
            </Alert>
        );
    }

    return (
        <Card shadow="sm" p="md">
            <Stack gap="md">
                {type === "ticket" ? (
                    // Ticket Filters
                    <>
                        <TextInput
                            placeholder="Search by title or message content..."
                            leftSection={<FontAwesomeIcon icon="search" />}
                            value={titleInput}
                            onChange={handleTitleChange}
                            w="100%"
                        />
                        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                            <Select
                                placeholder="Filter by assigned committee"
                                leftSection={<FontAwesomeIcon icon="user-group" />}
                                value={values.assignedGroup}
                                onChange={(value) => handleChange("assignedGroup", value)}
                                data={assignedGroupOptions}
                                clearable
                            />
                            <Select
                                placeholder="Filter by status"
                                leftSection={<FontAwesomeIcon icon="rotate" />}
                                value={values.status}
                                onChange={(value) => handleChange("status", value)}
                                data={statusOptions}
                                clearable
                            />
                        </SimpleGrid>
                        {user && (
                            <Checkbox
                                label="Show only my tickets"
                                checked={values.showOwn}
                                onChange={(e) => handleChange("showOwn", e.currentTarget.checked)}
                            />
                        )}
                    </>
                ) : (
                    // Report Filters
                    <>
                        <TextInput
                            placeholder="Search by message content..."
                            leftSection={<FontAwesomeIcon icon="search" />}
                            value={contentInput}
                            onChange={handleContentChange}
                            w="100%"
                        />
                        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                            <UserSearch
                                placeholder="Search by reported user..."
                                leftSection={<FontAwesomeIcon icon="user" />}
                                onChange={(user) => handleChange("targetUser", user?.osuId.toString() || "")}
                                width="100%"
                            />
                            <TextInput
                                placeholder="Search by tournament name..."
                                leftSection={<FontAwesomeIcon icon="trophy" />}
                                value={tournamentInput}
                                onChange={handleTournamentChange}
                            />
                        </SimpleGrid>
                        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                            <Select
                                placeholder="Filter by assigned committee"
                                leftSection={<FontAwesomeIcon icon="user-group" />}
                                value={values.assignedGroup}
                                onChange={(value) => handleChange("assignedGroup", value)}
                                data={assignedGroupOptions}
                                clearable
                            />
                            <Select
                                placeholder="Filter by status"
                                leftSection={<FontAwesomeIcon icon="rotate" />}
                                value={values.status}
                                onChange={(value) => handleChange("status", value)}
                                data={statusOptions}
                                clearable
                            />
                        </SimpleGrid>
                    </>
                )}
            </Stack>
        </Card>
    );
}
