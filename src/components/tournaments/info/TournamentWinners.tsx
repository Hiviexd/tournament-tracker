import { Stack, Group, Text, ActionIcon, Box, Pill, List } from "@mantine/core";
import { ITournament } from "../../../../interfaces/Tournament";
import { IUser } from "../../../../interfaces/User";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState, useRef } from "react";
import { loggedInUserAtom } from "../../../store/atoms";
import { useAtom } from "jotai";
import UserSearch, { UserSearchRef } from "../../common/UserSearch";
import UserLink from "../../common/UserLink";
import { notifications } from "@mantine/notifications";
import { useEditTournament } from "../../../hooks/useTournaments";

interface IProps {
    tournament: ITournament;
}

export default function TournamentWinners({ tournament }: IProps) {
    const [user] = useAtom(loggedInUserAtom);
    const [isEditing, setIsEditing] = useState(false);
    const [winners, setWinners] = useState<IUser[]>(tournament.winners || []);
    const [selectedUser, setSelectedUser] = useState<IUser | null>(null);
    const userSearchRef = useRef<UserSearchRef>(null);
    const editTournamentMutation = useEditTournament(tournament._id);

    const handleSave = async () => {
        await editTournamentMutation.mutateAsync({ winners: winners.map((winner) => winner._id) });
        setIsEditing(false);
    };

    const handleAddWinner = () => {
        if (selectedUser && !winners.some((w) => w._id === selectedUser._id)) {
            setWinners([...winners, selectedUser]);
            setSelectedUser(null);
            userSearchRef.current?.clearSelection();
        }
    };

    const handleRemoveWinner = (winnerId: string) => {
        setWinners(winners.filter((w) => w._id !== winnerId));
    };

    const handleCopyAllUserIds = () => {
        const userIds = winners.map((winner) => winner.osuId).join(",");
        navigator.clipboard.writeText(userIds);
        notifications.show({
            title: "User IDs copied",
            message: "All winner IDs copied to clipboard",
            color: "success",
        });
    };

    console.log(winners);

    return (
        <Stack gap={5}>
            <Group gap="xs" align="center">
                <Text size="sm" fw={500}>
                    Winners
                </Text>
                {isEditing ? (
                    <Group gap={4}>
                        <ActionIcon
                            variant="subtle"
                            onClick={() => {
                                setIsEditing(false);
                                setWinners(tournament.winners || []);
                            }}
                            color="danger"
                            title="Cancel">
                            <FontAwesomeIcon icon="xmark" />
                        </ActionIcon>
                        <ActionIcon
                            variant="subtle"
                            onClick={handleSave}
                            color="success"
                            title="Save"
                            loading={editTournamentMutation.isPending}>
                            <FontAwesomeIcon icon="save" />
                        </ActionIcon>
                    </Group>
                ) : user?.isCommittee ? (
                    <Group gap={4}>
                        <ActionIcon
                            variant="subtle"
                            onClick={() => setIsEditing(true)}
                            color="info"
                            title="Edit winners">
                            <FontAwesomeIcon icon="pen-to-square" />
                        </ActionIcon>
                        {winners.length > 0 && (
                            <ActionIcon
                                variant="subtle"
                                onClick={handleCopyAllUserIds}
                                color="success"
                                title="Copy all winner IDs">
                                <FontAwesomeIcon icon="copy" />
                            </ActionIcon>
                        )}
                    </Group>
                ) : null}
            </Group>

            {isEditing ? (
                <Stack gap="xs">
                    {winners.length > 0 ? (
                        <Pill.Group>
                            {winners.map((winner) => (
                                <Pill
                                    key={winner._id}
                                    withRemoveButton
                                    onRemove={() => handleRemoveWinner(winner._id)}
                                    styles={{
                                        root: { backgroundColor: "var(--mantine-color-primary-filled)" },
                                        label: { fontWeight: 700 },
                                    }}>
                                    {winner.username}
                                </Pill>
                            ))}
                        </Pill.Group>
                    ) : (
                        <Text size="sm" c="dimmed" fs="italic">
                            No winners set
                        </Text>
                    )}

                    <Group align="center" gap="xs" w="100%">
                        <UserSearch
                            ref={userSearchRef}
                            onChange={setSelectedUser}
                            placeholder="Search for a user to add..."
                            allowUserCreation
                            width="50%"
                        />
                        <ActionIcon
                            variant="subtle"
                            onClick={handleAddWinner}
                            color="success"
                            disabled={!selectedUser}
                            title="Add winner">
                            <FontAwesomeIcon icon="plus" />
                        </ActionIcon>
                    </Group>
                </Stack>
            ) : (
                <Box>
                    {winners.length > 0 ? (
                        <List spacing="4" size="sm">
                            {winners.map((winner) => (
                                <List.Item key={winner._id}>
                                    <Text size="sm">
                                        <UserLink user={winner} />
                                    </Text>
                                </List.Item>
                            ))}
                        </List>
                    ) : (
                        <Text size="sm" c="dimmed" fs="italic">
                            No winners set
                        </Text>
                    )}
                </Box>
            )}
        </Stack>
    );
}
