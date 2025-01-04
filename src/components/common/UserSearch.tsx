import React, { useState } from "react";
import { Combobox, InputBase, Loader, Group, Avatar, Text, useCombobox } from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { useUsers } from "../../hooks/useUsers";
import { IUser } from "../../../interfaces/User";

interface IProps {
    onChange: (value: string) => void;
    label?: string;
    error?: React.ReactNode;
    required?: boolean;
}

const UserOption = ({ username, avatarUrl }: { username: string; avatarUrl: string }) => (
    <Group wrap="nowrap">
        <Avatar src={avatarUrl} size={24} radius="xl" />
        <Text size="sm">{username}</Text>
    </Group>
);

export default function UserCombobox({ onChange, label, error, required }: IProps) {
    const [search, setSearch] = useState("");
    const [selectedUser, setSelectedUser] = useState<IUser | null>(null);
    const [debouncedSearch] = useDebouncedValue(search, 400);
    const { data: users = [], isLoading } = useUsers(debouncedSearch);
    const combobox = useCombobox();

    const options = users.map((user) => (
        <Combobox.Option value={user.id} key={user.id}>
            <UserOption username={user.username} avatarUrl={user.avatarUrl} />
        </Combobox.Option>
    ));

    return (
        <Combobox
            store={combobox}
            onOptionSubmit={(optionValue) => {
                const user = users.find((u) => u.id === optionValue);
                if (user) {
                    onChange(optionValue);
                    setSelectedUser(user);
                    setSearch(user.username);
                }
                combobox.closeDropdown();
            }}>
            <Combobox.Target>
                <InputBase
                    label={label}
                    withAsterisk={required}
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
    );
}
