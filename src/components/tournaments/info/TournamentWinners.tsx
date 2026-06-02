import { Stack, Group, Text, ActionIcon, Box, List } from "@mantine/core";
import { ITournament } from "../../../../interfaces/Tournament";
import { IUser } from "../../../../interfaces/User";
import { InfringementType } from "../../../../interfaces/Infringement";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { loggedInUserAtom } from "../../../store/atoms";
import { useAtom } from "jotai";
import MultipleUsersInput from "../../common/MultipleUsersInput";
import UserLink from "../../common/UserLink";
import { useEditTournament } from "../../../hooks/useTournaments";
import CopyActionIcon from "../../common/buttons/CopyActionIcon";
import { useConfirmModal } from "../../../hooks/useModals";
import utils from "../../../../utils";

interface IProps {
    tournament: ITournament;
}

function hasActiveTournamentBan(user: IUser): boolean {
    return utils.getActiveInfringement(user)?.type === InfringementType.TOURNAMENT_BAN;
}

export default function TournamentWinners({ tournament }: IProps) {
    const [user] = useAtom(loggedInUserAtom);
    const [isEditing, setIsEditing] = useState(false);
    const [winners, setWinners] = useState<IUser[]>(tournament.winners || []);
    const editTournamentMutation = useEditTournament(tournament.id);
    const confirmModal = useConfirmModal();

    const confirmTournamentBanWinners = (bannedWinners: IUser[]) => {
        if (bannedWinners.length === 0) return true;

        const names = utils.formatHostsList(bannedWinners);
        const message =
            bannedWinners.length === 1
                ? `${names} has an active tournament ban. Are you sure you want to save them as a winner?`
                : `The following winners have active tournament bans: ${names}. Are you sure you want to save?`;

        return confirmModal({
            title: "Active tournament bans",
            text: message,
            confirmText: "Save anyway",
            confirmProps: { color: "warning", leftSection: <FontAwesomeIcon icon="floppy-disk" /> },
        });
    };

    const handleSave = async () => {
        const bannedWinners = winners.filter(hasActiveTournamentBan);
        if (!(await confirmTournamentBanWinners(bannedWinners))) return;

        await editTournamentMutation.mutateAsync({ winners: winners.map((winner) => winner) });
        setIsEditing(false);
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
                <MultipleUsersInput
                    value={winners}
                    onChange={setWinners}
                    placeholder="Search for a user to add..."
                    allowUserCreation
                />
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
