import { useState, useRef } from "react";
import { Stack, Group, Pill, ActionIcon, Box, Textarea, Text, Tooltip } from "@mantine/core";
import { IUser } from "@tc/types/User";
import UserSearch, { UserSearchRef } from "./UserSearch";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { notifications } from "@mantine/notifications";
import utils from "@tc/utils/client";
import { useResolveUsers } from "../../hooks/useUsers";
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
    enableBatchMode?: boolean;
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
    enableBatchMode = false,
}: IProps) {
    const [selectedUser, setSelectedUser] = useState<IUser | null>(null);
    const [batchMode, setBatchMode] = useState(false);
    const [batchText, setBatchText] = useState("");
    const userSearchRef = useRef<UserSearchRef>(null);
    const resolveUsersMutation = useResolveUsers();
    const showBatchInput = enableBatchMode && batchMode;

    const handleAddUser = (user: IUser) => {
        if (!value.some((u) => u._id === user._id)) {
            onChange([...value, user]);
            setSelectedUser(null);
            userSearchRef.current?.clearSelection();
            userSearchRef.current?.focus();
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

    const handleAddBatch = async () => {
        const { identifiers, invalid } = utils.parseBatchUserInput(batchText);
        if (identifiers.length === 0 && invalid.length === 0) return;

        const result = await resolveUsersMutation.mutateAsync({ identifiers, allowUserCreation });
        const failed = [...invalid, ...result.failed];
        const added: IUser[] = [];
        let alreadyCount = 0;
        const knownIds = new Set(value.map((user) => user.id));

        for (const user of result.users) {
            if (knownIds.has(user.id)) {
                alreadyCount += 1;
                continue;
            }
            knownIds.add(user.id);
            added.push(user);
        }

        if (added.length > 0) onChange([...value, ...added]);
        setBatchText(failed.join("\n"));

        const parts: string[] = [];
        if (added.length > 0) parts.push(`${utils.formatCount(added.length, "user")} added.`);
        if (alreadyCount > 0) parts.push(`${alreadyCount} already in the list.`);
        if (failed.length > 0) parts.push(`Couldn't add: ${failed.join(", ")}`);
        notifications.show({
            title: "Batch add",
            message: parts.join(" "),
            color: failed.length > 0 ? "yellow" : "green",
        });
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
                            withRemoveButton={!disabled}
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

            <Group align="flex-start" gap="xs" w="100%" wrap="nowrap">
                <Box style={{ flex: 1, minWidth: 0 }}>
                    {showBatchInput ? (
                        <Textarea
                            value={batchText}
                            onChange={(event) => setBatchText(event.currentTarget.value)}
                            placeholder="Input user list here..."
                            autosize
                            minRows={2}
                            maxRows={8}
                            error={error}
                            disabled={disabled || resolveUsersMutation.isPending}
                        />
                    ) : (
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
                            error={error}
                        />
                    )}
                </Box>
                <ActionIcon
                    variant="light"
                    onClick={() => {
                        if (showBatchInput) {
                            handleAddBatch();
                            return;
                        }
                        if (selectedUser) handleAddUser(selectedUser);
                    }}
                    color="success"
                    size="lg"
                    loading={resolveUsersMutation.isPending}
                    disabled={showBatchInput ? !batchText.trim() || disabled : !selectedUser || disabled}
                    title={showBatchInput ? "Add users" : "Add user"}
                    style={{ flexShrink: 0 }}>
                    <FontAwesomeIcon icon="plus" />
                </ActionIcon>
                {enableBatchMode && (
                    <Tooltip label={batchMode ? "Single user search" : "Batch add mode"}>
                        <ActionIcon
                            variant={batchMode ? "filled" : "light"}
                            onClick={() => setBatchMode((current) => !current)}
                            color="info"
                            size="lg"
                            disabled={disabled || resolveUsersMutation.isPending}
                            style={{ flexShrink: 0 }}>
                            <FontAwesomeIcon icon={batchMode ? "search" : "list"} />
                        </ActionIcon>
                    </Tooltip>
                )}
            </Group>

            {showBatchInput && (
                <Text size="xs" c="dimmed">
                    Usernames, user IDs, or osu! profile links, separated by spaces, commas, or new lines
                </Text>
            )}

            {showActiveInfringementWarning && value.some((user) => user.activeInfringement) && (
                <AlertText size="xs" type="danger">
                    Some users have active infringements!
                </AlertText>
            )}
        </Stack>
    );
}
