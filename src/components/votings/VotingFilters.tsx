import { Card, Group, TextInput, Select, Stack } from "@mantine/core";
import { VotingCategory } from "../../../interfaces/Voting";
import { UserGroup } from "../../../interfaces/User";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface FilterValues {
    title: string;
    category: VotingCategory;
    assignedGroup: UserGroup;
    status: string;
}

interface IProps {
    values: FilterValues;
    onChange: (values: FilterValues) => void;
}

export default function VotingFilters({ values, onChange }: IProps) {
    const categoryOptions = [
        { value: "discussion", label: "Discussions" },
        { value: "tournament", label: "Tournaments" },
        { value: "user", label: "Users" },
    ];

    const assignedGroupOptions = [
        { value: "tc", label: "Tournament Committee" },
        { value: "cc", label: "Contest Committee" },
    ];

    const statusOptions = [
        { value: "active", label: "Active" },
        { value: "concluded", label: "Concluded" },
    ];

    const handleChange = (key: keyof FilterValues, value: any) => {
        onChange({ ...values, [key]: value });
    };

    return (
        <Card shadow="sm" p="md">
            <Stack align="stretch" w="100%">
                <TextInput
                    placeholder="Vote title..."
                    leftSection={<FontAwesomeIcon icon="search" />}
                    value={values.title}
                    onChange={(e) => handleChange("title", e.currentTarget.value)}
                    w="100%"
                />
                <Group>
                    <Select
                        placeholder="Category"
                        leftSection={<FontAwesomeIcon icon="folder" />}
                        value={values.category}
                        onChange={(value) => handleChange("category", value as VotingCategory)}
                        data={categoryOptions}
                        style={{ flex: 1, minWidth: 200 }}
                    />
                    <Select
                        placeholder="Assigned Group"
                        leftSection={<FontAwesomeIcon icon="user-group" />}
                        value={values.assignedGroup}
                        onChange={(value) => handleChange("assignedGroup", value as UserGroup)}
                        data={assignedGroupOptions}
                        style={{ flex: 1, minWidth: 200 }}
                    />
                    <Select
                        placeholder="Status"
                        leftSection={<FontAwesomeIcon icon="rotate" />}
                        value={values.status}
                        onChange={(value) => handleChange("status", value)}
                        data={statusOptions}
                        style={{ flex: 1, minWidth: 200 }}
                    />
                </Group>
            </Stack>
        </Card>
    );
}
