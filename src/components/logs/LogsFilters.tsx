import { Card, Group, TextInput, Select } from "@mantine/core";
import { LogCategory } from "../../../interfaces/Log";

interface FilterValues {
    user: string;
    category: LogCategory;
    type: string;
}

interface IProps {
    values: FilterValues;
    onChange: (values: FilterValues) => void;
}

export default function LogsFilters({ values, onChange }: IProps) {
    const categoryOptions = [
        { value: "account", label: "Account" },
        { value: "user", label: "User" },
        { value: "tournament", label: "Tournament" },
        { value: "report", label: "Report" },
        { value: "voting", label: "Voting" },
    ];

    const typeOptions = [
        { value: "user", label: "User" },
        { value: "system", label: "System" },
    ];

    const handleChange = (key: keyof FilterValues, value: any) => {
        onChange({ ...values, [key]: value });
    };

    return (
        <Card shadow="sm" p="md" bg="primary.11">
            <Group align="flex-end">
                <TextInput
                    placeholder="Enter username or osu! ID..."
                    value={values.user}
                    onChange={(e) => handleChange("user", e.currentTarget.value)}
                    style={{ flex: 1 }}
                />
                <Select
                    placeholder="Category"
                    value={values.category}
                    onChange={(value) => handleChange("category", value as LogCategory)}
                    data={categoryOptions}
                    style={{ width: 200 }}
                />
                <Select
                    placeholder="Type"
                    value={values.type}
                    onChange={(value) => handleChange("type", value)}
                    data={typeOptions}
                    style={{ width: 200 }}
                />
            </Group>
        </Card>
    );
}
