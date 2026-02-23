import { Card, Select, SimpleGrid, Stack } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { InfringementType } from "../../../interfaces/Infringement";
import { IUser } from "../../../interfaces/User";
import UserSearch from "../common/UserSearch";
import _ from "lodash";

interface FilterValues {
    search: string;
    type: InfringementType | "";
}

interface IProps {
    values: FilterValues;
    onChange: (values: FilterValues) => void;
}

export default function WatchlistFilters({ values, onChange }: IProps) {
    const infringementTypeOptions = [
        { value: InfringementType.NOTE, label: _.startCase(InfringementType.NOTE) },
        { value: InfringementType.WARNING, label: _.startCase(InfringementType.WARNING) },
        { value: InfringementType.TOURNAMENT_BAN, label: _.startCase(InfringementType.TOURNAMENT_BAN) },
        { value: InfringementType.HOSTING_BAN, label: _.startCase(InfringementType.HOSTING_BAN) },
        { value: InfringementType.STAFFING_BAN, label: _.startCase(InfringementType.STAFFING_BAN) },
    ];

    const handleChange = (key: keyof FilterValues, value: any) => {
        onChange({ ...values, [key]: value });
    };

    const handleUserChange = (user: IUser | null) => {
        handleChange("search", user ? user.osuId.toString() : "");
    };

    return (
        <Card shadow="sm" p="md">
            <Stack gap="md">
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                    <UserSearch
                        placeholder="Search by user..."
                        leftSection={<FontAwesomeIcon icon="user" />}
                        onChange={handleUserChange}
                        width="100%"
                    />
                    <Select
                        placeholder="Filter by infringement type"
                        leftSection={<FontAwesomeIcon icon="exclamation-triangle" />}
                        data={infringementTypeOptions}
                        value={values.type}
                        onChange={(value) => handleChange("type", value || "")}
                        clearable
                    />
                </SimpleGrid>
            </Stack>
        </Card>
    );
}
