import { Card, Group, TextInput, Select, Stack } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { UserGroup } from "../../../interfaces/User";

interface FilterValues {
    title: string;
    assignedGroup: UserGroup;
    status: string;
}

interface IProps {
    values: FilterValues;
    onChange: (values: FilterValues) => void;
}

export default function TicketsFilters({ values, onChange }: IProps) {
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

    return (
        <Card shadow="sm" p="md">
            <Stack gap="md">
                <TextInput
                    placeholder="Search by title..."
                    leftSection={<FontAwesomeIcon icon="search" />}
                    value={values.title}
                    onChange={(e) => handleChange("title", e.currentTarget.value)}
                    w="100%"
                />
                <Group>
                    <Select
                        placeholder="Committee"
                        value={values.assignedGroup}
                        onChange={(value) => handleChange("assignedGroup", value as UserGroup)}
                        data={assignedGroupOptions}
                        clearable
                        style={{ flex: 1, minWidth: 200 }}
                    />
                    <Select
                        placeholder="Status"
                        value={values.status}
                        onChange={(value) => handleChange("status", value)}
                        data={statusOptions}
                        clearable
                        style={{ flex: 1, minWidth: 200 }}
                    />
                </Group>
            </Stack>
        </Card>
    );
}

/**
 * TODO:
 * 1. Reports should be searchable by username and tournament name
 * 2. Need a "Show my own tickets" checkbox
 * 3. Do not display report filters for non-committee users, use an alert instead
 */
