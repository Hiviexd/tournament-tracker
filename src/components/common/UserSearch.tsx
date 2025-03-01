import { useState } from "react";
import { Combobox, InputBase, Loader, Stack, ActionIcon, Text, useCombobox } from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { useUsers, useCreateUser } from "../../hooks/useUsers";
import { IUser } from "../../../interfaces/User";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import UserOption from "./UserSearch/UserOption";
import NoResultsOption from "./UserSearch/NoResultsOption";

interface IProps {
    onChange: (user: IUser | null) => void;
    label?: string;
    placeholder?: string;
    leftSection?: React.ReactNode;
    error?: React.ReactNode;
    required?: boolean;
    width?: string;
    allowUserCreation?: boolean;
    disabled?: boolean;
}

export default function UserSearch({
    onChange,
    label,
    placeholder = "Search by username or osu! ID...",
    leftSection,
    error,
    required,
    width = "100%",
    allowUserCreation = false,
    disabled = false,
}: IProps) {
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedValue] = useDebouncedValue(search, 400);
    const [selectedUser, setSelectedUser] = useState<IUser | null>(null);
    const { data: users = [], isLoading } = useUsers(debouncedSearch, 5);
    const createUserMutation = useCreateUser();
    const combobox = useCombobox();

    const isSearchComplete = search === debouncedSearch && !isLoading;
    const isLoaderVisible = isLoading || createUserMutation.isPending;
    const shouldShowDropdown = search && !isLoaderVisible && (isLoading || users.length > 0 || isSearchComplete);

    const handleChange = (value: string) => {
        setSearch(value);
        setDebouncedValue(value);
        combobox.updateSelectedOptionIndex();
    };

    const handleSelect = (user: IUser | null) => {
        setSelectedUser(user);
        setSearch("");
        onChange(user);
        combobox.closeDropdown();
    };

    const handleCreateUser = async () => {
        if (!search) return;

        try {
            const data = (await createUserMutation.mutateAsync(search)) as { user: IUser; message: string };
            if (data.user) handleSelect(data.user);
        } catch (error) {
            console.error("Failed to create user:", error);
        }
    };

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
                        <ActionIcon size="sm" variant="subtle" color="gray" onClick={() => handleSelect(null)}>
                            <FontAwesomeIcon icon="times" />
                        </ActionIcon>
                    }
                    error={error}>
                    <UserOption username={selectedUser.username} avatarUrl={selectedUser.avatarUrl} />
                </InputBase>
            ) : (
                <Combobox
                    store={combobox}
                    onOptionSubmit={(value) => {
                        const user = users.find((u) => u.id === value);
                        if (user) handleSelect(user);
                    }}>
                    <Combobox.Target>
                        <InputBase
                            w={width}
                            leftSection={leftSection}
                            error={error}
                            rightSection={isLoaderVisible ? <Loader size="xs" /> : <Combobox.Chevron />}
                            onClick={combobox.openDropdown}
                            onFocus={combobox.openDropdown}
                            onChange={(e) => handleChange(e.currentTarget.value)}
                            value={search}
                            placeholder={placeholder}
                            disabled={disabled}
                        />
                    </Combobox.Target>

                    <Combobox.Dropdown hidden={!shouldShowDropdown}>
                        <Combobox.Options>
                            {users.map((user) => (
                                <Combobox.Option value={user.id} key={user.id}>
                                    <UserOption username={user.username} avatarUrl={user.avatarUrl} />
                                </Combobox.Option>
                            ))}
                        </Combobox.Options>

                        {isSearchComplete && users.length === 0 && (
                            <NoResultsOption
                                search={search}
                                onAdd={handleCreateUser}
                                isLoading={createUserMutation.isPending}
                                allowUserCreation={allowUserCreation}
                            />
                        )}
                    </Combobox.Dropdown>
                </Combobox>
            )}
        </Stack>
    );
}
