import { Card, TextInput, Select, Stack, Alert, Checkbox, SimpleGrid } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { UserGroup } from "../../../interfaces/User";
import UserSearch from "../common/UserSearch";
import { useAtom } from "jotai";
import { loggedInUserAtom } from "../../store/atoms";

interface FilterValues {
    title: string;
    targetUser: string;
    targetTournament: string;
    assignedGroup: UserGroup;
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

    // Non-committee users viewing reports
    if (type === "report" && !user?.isCommittee && !user?.isAdmin) {
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
                            placeholder="Search by title..."
                            leftSection={<FontAwesomeIcon icon="search" />}
                            value={values.title}
                            onChange={(e) => handleChange("title", e.currentTarget.value)}
                            w="100%"
                        />
                        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                            <Select
                                placeholder="Filter by assigned committee"
                                leftSection={<FontAwesomeIcon icon="user-group" />}
                                value={values.assignedGroup}
                                onChange={(value) => handleChange("assignedGroup", value as UserGroup)}
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
                                value={values.targetTournament}
                                onChange={(e) => handleChange("targetTournament", e.currentTarget.value)}
                            />
                        </SimpleGrid>
                        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                            <Select
                                placeholder="Filter by assigned committee"
                                leftSection={<FontAwesomeIcon icon="user-group" />}
                                value={values.assignedGroup}
                                onChange={(value) => handleChange("assignedGroup", value as UserGroup)}
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
