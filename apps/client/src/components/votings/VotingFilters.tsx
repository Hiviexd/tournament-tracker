import { Card, Group, TextInput, Select, Stack, Checkbox } from "@mantine/core";
import { useDebouncedCallback } from "@mantine/hooks";
import { useState } from "react";
import { VotingCategory } from "@tc/types/Voting";
import { IUser, UserGroup } from "@tc/types/User";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface FilterValues {
    title: string;
    category: VotingCategory;
    assignedGroup: UserGroup;
    status: string;
    showNeedsAttention: boolean;
    visibility: string;
}

interface IProps {
    user: IUser | null;
    values: FilterValues;
    onChange: (values: FilterValues) => void;
}

export default function VotingFilters({ user, values, onChange }: IProps) {
    // Local state for title input (for immediate UI updates)
    const [titleInput, setTitleInput] = useState(values.title);

    // Debounced onChange handler for title
    const debouncedOnChange = useDebouncedCallback((newValues: FilterValues) => {
        onChange(newValues);
    }, 400);

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

    const visibilityOptions = [
        { value: "public", label: "Public" },
        { value: "private", label: "Private" },
    ];

    const handleChange = (key: keyof FilterValues, value: any) => {
        // If toggling needs attention, also set status to active
        if (key === "showNeedsAttention" && value === true) {
            onChange({
                ...values,
                showNeedsAttention: true,
            });
        } else {
            onChange({ ...values, [key]: value });
        }
    };

    const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = event.currentTarget.value;
        setTitleInput(newValue); // Update input immediately
        debouncedOnChange({ ...values, title: newValue }); // Debounce the onChange call
    };

    return (
        <Card shadow="sm" p="md">
            <Stack align="stretch" w="100%">
                <TextInput
                    placeholder="Search by title..."
                    leftSection={<FontAwesomeIcon icon="search" />}
                    value={titleInput}
                    onChange={handleTitleChange}
                    w="100%"
                />
                <Group>
                    <Select
                        placeholder="Filter by category"
                        leftSection={<FontAwesomeIcon icon="folder" />}
                        value={values.category}
                        onChange={(value) => handleChange("category", value as VotingCategory)}
                        data={categoryOptions}
                        style={{ flex: 1, minWidth: 200 }}
                        clearable
                    />
                    <Select
                        placeholder="Filter by assigned group"
                        leftSection={<FontAwesomeIcon icon="user-group" />}
                        value={values.assignedGroup}
                        onChange={(value) => handleChange("assignedGroup", value as UserGroup)}
                        data={assignedGroupOptions}
                        style={{ flex: 1, minWidth: 200 }}
                        disabled={values.showNeedsAttention}
                        clearable
                    />
                    {user?.isCommittee && (
                        <Select
                            placeholder="Filter by status"
                            leftSection={<FontAwesomeIcon icon="rotate" />}
                            value={values.status}
                            onChange={(value) => handleChange("status", value)}
                            data={statusOptions}
                            style={{ flex: 1, minWidth: 200 }}
                            disabled={values.showNeedsAttention}
                            clearable
                        />
                    )}
                    {user?.isCommittee && (
                        <Select
                            placeholder="Filter by visibility"
                            leftSection={<FontAwesomeIcon icon="eye" />}
                            value={values.visibility}
                            onChange={(value) => handleChange("visibility", value)}
                            data={visibilityOptions}
                            style={{ flex: 1, minWidth: 200 }}
                            clearable
                        />
                    )}
                </Group>
                {user?.isCommittee && (
                    <Checkbox
                        label="Filter to votes that need attention"
                        checked={values.showNeedsAttention}
                        onChange={(e) => handleChange("showNeedsAttention", e.currentTarget.checked)}
                    />
                )}
            </Stack>
        </Card>
    );
}
