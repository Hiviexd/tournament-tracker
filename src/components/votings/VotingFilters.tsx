import { Card, Group, TextInput, Select, Stack, Checkbox } from "@mantine/core";
import { VotingCategory } from "../../../interfaces/Voting";
import { UserGroup } from "../../../interfaces/User";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface FilterValues {
    title: string;
    category: VotingCategory;
    assignedGroup: UserGroup;
    status: string;
    showNeedsAttention: boolean; // Add this field
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
        // If toggling needs attention, also set status to active
        if (key === "showNeedsAttention" && value === true) {
            onChange({
                ...values,
                showNeedsAttention: true,
                status: "active",
            });
        } else {
            onChange({ ...values, [key]: value });
        }
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
                        disabled={values.showNeedsAttention}
                    />
                </Group>
                <Checkbox
                    label="Only show votes that need my attention"
                    checked={values.showNeedsAttention}
                    onChange={(e) => handleChange("showNeedsAttention", e.currentTarget.checked)}
                />
            </Stack>
        </Card>
    );
}
