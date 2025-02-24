import { Card, Stack, Select, SimpleGrid } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { LogCategory } from "../../../interfaces/Log";
import UserSearch from "../common/UserSearch";
import { IUser } from "../../../interfaces/User";

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
        { value: "ticket", label: "Ticket" },
    ];

    const typeOptions = [
        { value: "user", label: "User" },
        { value: "system", label: "System" },
    ];

    const handleChange = (key: keyof FilterValues, value: any) => {
        onChange({ ...values, [key]: value });
    };

    const handleUserSelect = (user: IUser | null) => {
        handleChange("user", user ? user.username : "");
    };

    return (
        <Card shadow="sm" p="md">
            <Stack gap="md">
                <UserSearch
                    placeholder="Search by username or osu! ID..."
                    leftSection={<FontAwesomeIcon icon="user" />}
                    onChange={handleUserSelect}
                    width="100%"
                    allowUserCreation
                />
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                    <Select
                        placeholder="Category"
                        leftSection={<FontAwesomeIcon icon="folder" />}
                        value={values.category}
                        onChange={(value) => handleChange("category", value as LogCategory)}
                        data={categoryOptions}
                        clearable
                    />
                    <Select
                        placeholder="Type"
                        leftSection={<FontAwesomeIcon icon="list" />}
                        value={values.type}
                        onChange={(value) => handleChange("type", value)}
                        data={typeOptions}
                        clearable
                    />
                </SimpleGrid>
            </Stack>
        </Card>
    );
}
