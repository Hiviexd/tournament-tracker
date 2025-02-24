import React, { useState } from "react";
import {
    Combobox,
    InputBase,
    Loader,
    Group,
    Avatar,
    Text,
    useCombobox,
    Stack,
    ActionIcon,
    Button,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { useUsers, useCreateUser } from "../../hooks/useUsers";
import { IUser } from "../../../interfaces/User";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface IProps {
    onChange: (user: IUser | null) => void;
    label?: string;
    placeholder?: string;
    leftSection?: React.ReactNode;
    error?: React.ReactNode;
    required?: boolean;
    width?: string;
}

const UserOption = ({ username, avatarUrl }: { username: string; avatarUrl: string }) => (
    <Group wrap="nowrap">
        <Avatar src={avatarUrl} size={24} radius="xl" />
        <Text size="sm">{username}</Text>
    </Group>
);

const NoResultsOption = ({ search, onAdd, isLoading }: { search: string; onAdd: () => void; isLoading: boolean }) => (
    <Group p="xs" justify="space-between" wrap="nowrap">
        <Text size="sm" c="dimmed">
            No users found matching "{search}"
        </Text>
        <Button
            variant="light"
            size="xs"
            onClick={onAdd}
            leftSection={<FontAwesomeIcon icon="plus" />}
            loading={isLoading}>
            Add User
        </Button>
    </Group>
);

export default function UserSearch({
    onChange,
    label,
    placeholder,
    leftSection,
    error,
    required,
    width = "100%",
}: IProps) {
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedValue] = useDebouncedValue(search, 400);
    const [selectedUser, setSelectedUser] = useState<IUser | null>(null);
    const limit = 5;
    const { data: users = [], isLoading } = useUsers(debouncedSearch, limit);
    const createUserMutation = useCreateUser();
    const combobox = useCombobox();

    const handleCreateUser = async () => {
        if (!search) return;

        try {
            const data = (await createUserMutation.mutateAsync(search)) as { user: IUser; message: string };
            if (data.user) {
                onChange(data.user);
                setSelectedUser(data.user);
                setSearch("");
                combobox.closeDropdown();
            }
        } catch (error) {
            console.error("Failed to create user:", error);
        }
    };

    const options = users.map((user) => (
        <Combobox.Option value={user.id} key={user.id}>
            <UserOption username={user.username} avatarUrl={user.avatarUrl} />
        </Combobox.Option>
    ));

    const handleUnselect = () => {
        setSelectedUser(null);
        setSearch("");
        onChange(null);
    };

    const shouldShowDropdown = search && (isLoading || users.length > 0 || (search === debouncedSearch && !isLoading));

    return (
        <Stack gap={2}>
            {label && (
                <Text size="sm" fw={500}>
                    {label} {required && <span style={{ color: "var(--mantine-color-red-6)" }}>*</span>}
                </Text>
            )}
            {selectedUser ? (
                <InputBase
                    w={width}
                    component="button"
                    type="button"
                    pointer
                    rightSection={
                        <ActionIcon size="sm" variant="subtle" color="gray" onClick={handleUnselect}>
                            <FontAwesomeIcon icon="times" />
                        </ActionIcon>
                    }
                    error={error}>
                    <UserOption username={selectedUser.username} avatarUrl={selectedUser.avatarUrl} />
                </InputBase>
            ) : (
                <div style={{ width }}>
                    <Combobox
                        store={combobox}
                        onOptionSubmit={(optionValue) => {
                            const user = users.find((u) => u.id === optionValue);
                            if (user) {
                                onChange(user);
                                setSelectedUser(user);
                                setSearch("");
                            }
                            combobox.closeDropdown();
                        }}>
                        <Combobox.Target>
                            <InputBase
                                leftSection={leftSection}
                                error={error}
                                rightSection={
                                    isLoading || createUserMutation.isPending ? (
                                        <Loader size="xs" />
                                    ) : (
                                        <Combobox.Chevron />
                                    )
                                }
                                onClick={() => combobox.openDropdown()}
                                onFocus={() => combobox.openDropdown()}
                                onChange={(e) => {
                                    const value = e.currentTarget.value;
                                    setSearch(value);
                                    setDebouncedValue(value);
                                    combobox.updateSelectedOptionIndex();
                                }}
                                value={search}
                                placeholder={placeholder ?? "Search by username or osu! ID..."}
                            />
                        </Combobox.Target>

                        <Combobox.Dropdown hidden={!shouldShowDropdown}>
                            <Combobox.Options>{options}</Combobox.Options>
                            {/* Only show NoResultsOption when:
                                1. There's a search term
                                2. The search is complete (not loading)
                                3. No results were found
                                4. The debounced search matches the current search
                            */}
                            {search && !isLoading && users.length === 0 && search === debouncedSearch && (
                                <NoResultsOption
                                    search={search}
                                    onAdd={handleCreateUser}
                                    isLoading={createUserMutation.isPending}
                                />
                            )}
                        </Combobox.Dropdown>
                    </Combobox>
                </div>
            )}
        </Stack>
    );
}
