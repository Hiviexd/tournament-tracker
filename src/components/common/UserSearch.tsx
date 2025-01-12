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
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { useUsers } from "../../hooks/useUsers";
import { IUser } from "../../../interfaces/User";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface IProps {
    onChange: (user: IUser | null) => void;
    label?: string;
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

export default function UserSearch({ onChange, label, error, required, width = "100%" }: IProps) {
    const [search, setSearch] = useState("");
    const [selectedUser, setSelectedUser] = useState<IUser | null>(null);
    const [debouncedSearch] = useDebouncedValue(search, 400);
    const limit = 5;
    const { data: users = [], isLoading } = useUsers(debouncedSearch, limit);
    const combobox = useCombobox();

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

    return (
        <Stack gap={2}>
            {label && (
                <Text size="sm" fw={500}>
                    {label}{" "}
                    {required && <span style={{ color: "var(--mantine-color-red-6)" }}>*</span>}
                </Text>
            )}
            {selectedUser ? (
                <InputBase
                    w={width}
                    component="button"
                    type="button"
                    pointer
                    rightSection={
                        <ActionIcon
                            size="sm"
                            variant="subtle"
                            color="gray"
                            onClick={handleUnselect}>
                            <FontAwesomeIcon icon="times" />
                        </ActionIcon>
                    }
                    error={error}>
                    <UserOption
                        username={selectedUser.username}
                        avatarUrl={selectedUser.avatarUrl}
                    />
                </InputBase>
            ) : (
                <Combobox
                    w={width}
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
                            error={error}
                            rightSection={isLoading ? <Loader size="xs" /> : <Combobox.Chevron />}
                            onClick={() => combobox.openDropdown()}
                            onFocus={() => combobox.openDropdown()}
                            onChange={(e) => {
                                setSearch(e.currentTarget.value);
                                combobox.updateSelectedOptionIndex();
                            }}
                            value={search}
                            placeholder="Search by username or osu! ID..."
                        />
                    </Combobox.Target>

                    <Combobox.Dropdown hidden={users.length === 0}>
                        <Combobox.Options>{options}</Combobox.Options>
                    </Combobox.Dropdown>
                </Combobox>
            )}
        </Stack>
    );
}
