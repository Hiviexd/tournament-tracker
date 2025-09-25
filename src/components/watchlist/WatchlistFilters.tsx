import { useState, useEffect } from "react";
import { Card, Group, Stack, Select, TextInput, ActionIcon, Tooltip } from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { InfringementType } from "../../../interfaces/User";
import utils from "../../../utils";

interface FilterValues {
    user: string;
    infringementType: InfringementType | "";
}

interface IProps {
    values: FilterValues;
    onChange: (values: FilterValues) => void;
}

export default function WatchlistFilters({ values, onChange }: IProps) {
    const [searchInput, setSearchInput] = useState(values.user);
    const [debouncedSearchInput] = useDebouncedValue(searchInput, 300);

    const handleChange = (key: keyof FilterValues, value: any) => {
        onChange({ ...values, [key]: value });
    };

    // Update the filter values when debounced search changes
    useEffect(() => {
        if (debouncedSearchInput !== values.user) {
            handleChange("user", debouncedSearchInput);
        }
    }, [debouncedSearchInput, values.user]);

    const infringementTypeOptions = [
        { value: "", label: "All Types" },
        { value: InfringementType.NOTE, label: "Note" },
        { value: InfringementType.WARNING, label: "Warning" },
        { value: InfringementType.PROBATION, label: "Probation" },
        { value: InfringementType.TOURNAMENT_BAN, label: "Tournament Ban" },
        { value: InfringementType.HOSTING_BAN, label: "Hosting Ban" },
        { value: InfringementType.STAFFING_BAN, label: "Staffing Ban" },
    ];

    const handleUserSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.currentTarget.value;
        setSearchInput(value);
    };

    const handleExportCsv = async () => {
        try {
            const response = await utils.apiCall({
                method: "get",
                url: "/api/users/watchlist/export",
                params: {
                    user: values.user || undefined,
                    infringementType: values.infringementType || undefined,
                },
                responseType: "blob",
            });

            if (response) {
                const url = window.URL.createObjectURL(new Blob([response]));
                const link = document.createElement("a");
                link.href = url;
                link.setAttribute("download", `watchlist-${new Date().toISOString().split("T")[0]}.csv`);
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error("Failed to export CSV:", error);
        }
    };

    const handleClearFilters = () => {
        setSearchInput("");
        onChange({
            user: "",
            infringementType: "",
        });
    };

    const hasActiveFilters = values.user || values.infringementType;

    return (
        <Card shadow="sm" p="lg">
            <Stack gap="md">
                <Group grow align="flex-end">
                    <TextInput
                        label="Search by user"
                        placeholder="Username or osu! ID..."
                        value={searchInput}
                        onChange={handleUserSearch}
                        leftSection={<FontAwesomeIcon icon="search" />}
                    />

                    <Select
                        label="Infringement Type"
                        placeholder="Filter by type..."
                        data={infringementTypeOptions}
                        value={values.infringementType}
                        onChange={(value) => handleChange("infringementType", value || "")}
                        clearable
                        searchable
                    />

                    <Group gap="xs">
                        {hasActiveFilters && (
                            <Tooltip label="Clear all filters">
                                <ActionIcon variant="light" color="gray" onClick={handleClearFilters} size="lg">
                                    <FontAwesomeIcon icon="times" />
                                </ActionIcon>
                            </Tooltip>
                        )}

                        <Tooltip label="Export as CSV">
                            <ActionIcon variant="light" color="blue" onClick={handleExportCsv} size="lg">
                                <FontAwesomeIcon icon="download" />
                            </ActionIcon>
                        </Tooltip>
                    </Group>
                </Group>
            </Stack>
        </Card>
    );
}
