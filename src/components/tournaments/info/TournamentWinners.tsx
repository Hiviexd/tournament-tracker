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
import CopyActionIcon from "../../common/buttons/CopyActionIcon";

interface IProps {
    tournament: ITournament;
}

export default function TournamentWinners({ tournament }: IProps) {
    const [user] = useAtom(loggedInUserAtom);
    const [isEditing, setIsEditing] = useState(false);
    const [winners, setWinners] = useState<IUser[]>(tournament.winners || []);
    const [selectedUser, setSelectedUser] = useState<IUser | null>(null);
    const userSearchRef = useRef<UserSearchRef>(null);
    const editTournamentMutation = useEditTournament(tournament.id);

    const handleSave = async () => {
        await editTournamentMutation.mutateAsync({ winners: winners.map((winner) => winner) });
        setIsEditing(false);
    };

    const handleAddWinner = (winner: IUser) => {
        if (!winners.some((w) => w._id === winner._id)) {
            setWinners([...winners, winner]);
            setSelectedUser(null);
            userSearchRef.current?.clearSelection();
        } else {
            notifications.show({
                title: "User already in list",
                message: "This user is already in the list of winners",
                color: "red",
            });
        }
    };

    const handleRemoveWinner = (winnerId: string) => {
        setWinners(winners.filter((w) => w.id !== winnerId));
    };

    return (
        <Stack gap={5}>
            <Group gap="xs" align="center">
                <Text size="sm" fw={500} className="header-border-left">
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
                ) : user?.isCommitteeOrAdmin ? (
                    <Group gap={4}>
                        <ActionIcon
                            variant="subtle"
                            onClick={() => setIsEditing(true)}
                            color="info"
                            title="Edit winners">
                            <FontAwesomeIcon icon="pen-to-square" />
                        </ActionIcon>
                        {winners.length > 0 && (
                            <CopyActionIcon
                                value={winners.map((winner) => winner.osuId).join(",")}
                                tooltip="Copy all winner IDs"
                            />
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
                                    key={winner.id}
                                    withRemoveButton
                                    onRemove={() => handleRemoveWinner(winner.id)}
                                    styles={{
                                        root: {
                                            backgroundColor: "var(--mantine-color-primary-light)",
                                            color: "var(--mantine-color-primary-light-color)",
                                        },
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
                            onEnterWhenSelected={() => {
                                if (selectedUser) {
                                    handleAddWinner(selectedUser);
                                }
                            }}
                            placeholder="Search for a user to add..."
                            allowUserCreation
                            width="50%"
                        />
                        <ActionIcon
                            variant="subtle"
                            onClick={() => {
                                if (selectedUser) {
                                    handleAddWinner(selectedUser);
                                }
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && selectedUser) {
                                    handleAddWinner(selectedUser);
                                }
                            }}
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
                                <List.Item key={winner.id}>
                                    <Text size="sm">
                                        <UserLink user={winner} displayActiveInfringement />
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
