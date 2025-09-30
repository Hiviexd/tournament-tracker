import { useState, useRef } from "react";
import { Stack, Group, Pill, ActionIcon } from "@mantine/core";
import { IUser } from "../../../interfaces/User";
import UserSearch, { UserSearchRef } from "./UserSearch";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { notifications } from "@mantine/notifications";
import AlertText from "./AlertText";

interface IProps {
    value: IUser[];
    onChange: (users: IUser[]) => void;
    label?: string;
    placeholder?: string;
    required?: boolean;
    error?: string;
    allowUserCreation?: boolean;
    showActiveInfringementWarning?: boolean;
    disabled?: boolean;
}

export default function MultipleUsersInput({
    value,
    onChange,
    label,
    placeholder = "Search for a user to add...",
    required = false,
    error,
    allowUserCreation = false,
    showActiveInfringementWarning = false,
    disabled = false,
}: IProps) {
    const [selectedUser, setSelectedUser] = useState<IUser | null>(null);
    const userSearchRef = useRef<UserSearchRef>(null);

    const handleAddUser = (user: IUser) => {
        if (!value.some((u) => u._id === user._id)) {
            onChange([...value, user]);
            setSelectedUser(null);
            userSearchRef.current?.clearSelection();
        } else {
            notifications.show({
                title: "User already in list",
                message: "This user is already in the list",
                color: "red",
            });
        }
    };

    const handleRemoveUser = (userId: string) => {
        onChange(value.filter((u) => u.id !== userId));
    };

    return (
        <Stack gap={2}>
            {label && (
                <label style={{ fontWeight: 500, fontSize: "14px" }}>
                    {label} {required && <span style={{ color: "var(--mantine-color-red-filled)" }}>*</span>}
                </label>
            )}

            {value.length > 0 && (
                <Pill.Group mb="xs" mt={2}>
                    {value.map((user) => (
                        <Pill
                            key={user.id}
                            withRemoveButton
                            onRemove={() => handleRemoveUser(user.id)}
                            styles={{
                                root: {
                                    backgroundColor: "var(--mantine-color-primary-light)",
                                    color: "var(--mantine-color-primary-light-color)",
                                },
                                label: { fontWeight: 700 },
                            }}>
                            {user.activeInfringement && (
                                <>
                                    <FontAwesomeIcon
                                        icon="gavel"
                                        color="var(--mantine-color-red-filled)"
                                        style={{ marginRight: "6px" }}
                                    />
                                </>
                            )}

                            {user.username}
                        </Pill>
                    ))}
                </Pill.Group>
            )}

            <Group align="center" gap="xs" w="100%" wrap="nowrap">
                <UserSearch
                    ref={userSearchRef}
                    onChange={setSelectedUser}
                    onEnterWhenSelected={() => {
                        if (selectedUser) {
                            handleAddUser(selectedUser);
                        }
                    }}
                    placeholder={placeholder}
                    allowUserCreation={allowUserCreation}
                    disabled={disabled}
                />
                <ActionIcon
                    variant="light"
                    onClick={() => {
                        if (selectedUser) {
                            handleAddUser(selectedUser);
                        }
                    }}
                    color="success"
                    size="lg"
                    disabled={!selectedUser || disabled}
                    title="Add user">
                    <FontAwesomeIcon icon="plus" />
                </ActionIcon>
            </Group>

            {error && <div style={{ color: "var(--mantine-color-red-filled)", fontSize: "12px" }}>{error}</div>}

            {showActiveInfringementWarning && value.some((user) => user.activeInfringement) && (
                <AlertText size="xs" type="danger">
                    Some users have active infringements!
                </AlertText>
            )}
        </Stack>
    );
}
