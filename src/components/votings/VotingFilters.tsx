import { Card, Group, TextInput, Select } from "@mantine/core";
import { VotingCategory } from "../../../interfaces/Voting";
import { UserGroup } from "../../../interfaces/User";

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
        { value: "", label: "All Categories" },
        { value: "discussion", label: "Discussions" },
        { value: "tournament", label: "Tournaments" },
        { value: "user", label: "Users" },
    ];

    const assignedGroupOptions = [
        { value: "", label: "All Groups" },
        { value: "tc", label: "Tournament Committee" },
        { value: "cc", label: "Contest Committee" },
    ];

    const statusOptions = [
        { value: "", label: "All votes" },
        { value: "active", label: "Active votes only" },
    ];

    const handleChange = (key: keyof FilterValues, value: any) => {
        onChange({ ...values, [key]: value });
    };

    return (
        <Card shadow="sm" p="md" bg="primary.11">
            <Group align="flex-end">
                <TextInput
                    placeholder="Search by title..."
                    value={values.title}
                    onChange={(e) => handleChange("title", e.currentTarget.value)}
                    style={{ flex: 1 }}
                />
                <Select
                    value={values.category}
                    onChange={(value) => handleChange("category", value as VotingCategory)}
                    data={categoryOptions}
                    style={{ width: 200 }}
                />
                <Select
                    value={values.assignedGroup}
                    onChange={(value) => handleChange("assignedGroup", value as UserGroup)}
                    data={assignedGroupOptions}
                    style={{ width: 200 }}
                />
                <Select
                    value={values.status}
                    onChange={(value) => handleChange("status", value)}
                    data={statusOptions}
                    style={{ width: 200 }}
                />
            </Group>
        </Card>
    );
}
