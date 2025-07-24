import { Card, TextInput, Select, Stack, Button, SimpleGrid } from "@mantine/core";
import { useDebouncedCallback } from "@mantine/hooks";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ResourceCategory, ResourceType } from "../../../interfaces/Resource";
import UserSearch from "../common/UserSearch";
import { useAtom } from "jotai";
import { loggedInUserAtom } from "../../store/atoms";

interface FilterValues {
    search: string;
    author: string;
    category: ResourceCategory | "";
    type: ResourceType;
}

interface IProps {
    values: FilterValues;
    onChange: (values: FilterValues) => void;
    onCreateClick: () => void;
}

export default function ResourcesFilters({ values, onChange, onCreateClick }: IProps) {
    const [user] = useAtom(loggedInUserAtom);

    // Local state for search input (for immediate UI updates)
    const [searchInput, setSearchInput] = useState(values.search);

    // Debounced onChange handler for search
    const debouncedOnChange = useDebouncedCallback((newValues: FilterValues) => {
        onChange(newValues);
    }, 400);

    const categoryOptions = [
        { value: "discord", label: "Discord Server" },
        { value: "tool", label: "Tool" },
        { value: "guide", label: "Guide" },
        { value: "spreadsheet", label: "Spreadsheet" },
        { value: "article", label: "Article" },
    ] as const;

    const handleChange = (key: keyof FilterValues, value: any) => {
        onChange({ ...values, [key]: value });
    };

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = event.currentTarget.value;
        setSearchInput(newValue); // Update input immediately
        debouncedOnChange({ ...values, search: newValue }); // Debounce the onChange call
    };

    return (
        <Card shadow="sm" p="md">
            <Stack gap="md">
                <SimpleGrid cols={{ base: 1, sm: user ? 3 : 2 }} spacing="md">
                    <TextInput
                        placeholder="Search resources..."
                        leftSection={<FontAwesomeIcon icon="search" />}
                        value={searchInput}
                        onChange={handleSearchChange}
                    />
                    {user && (
                        <UserSearch
                            placeholder="Filter by author..."
                            leftSection={<FontAwesomeIcon icon="user" />}
                            onChange={(user) => handleChange("author", user?.osuId.toString() || "")}
                            width="100%"
                        />
                    )}
                    <Select
                        placeholder="Filter by category"
                        leftSection={<FontAwesomeIcon icon="folder" />}
                        value={values.category}
                        onChange={(value) => handleChange("category", value as ResourceCategory)}
                        data={categoryOptions}
                        clearable
                    />
                </SimpleGrid>
                {user?.isCommittee && (
                    <Button leftSection={<FontAwesomeIcon icon="plus" />} onClick={onCreateClick}>
                        Create Resource
                    </Button>
                )}
            </Stack>
        </Card>
    );
}
