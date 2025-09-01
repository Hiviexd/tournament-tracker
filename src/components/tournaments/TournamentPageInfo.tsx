import { Stack, Group, Title, Button, Card, SimpleGrid, Text } from "@mantine/core";
import { ITournament } from "../../../interfaces/Tournament";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useDeleteTournament, useEditTournament } from "../../hooks/useTournaments";
import { useConfirmModal } from "../../hooks/useModals";
import TournamentStatus from "./info/TournamentStatus";
import TournamentTags from "./info/TournamentTags";
import TournamentDates from "./info/TournamentDates";
import TournamentBadges from "./info/TournamentBadges";
import TournamentForumUrl from "./info/TournamentForumUrl";
import TournamentEnchantUrl from "./info/TournamentEnchantUrl";
import TournamentDiscordThread from "./info/TournamentDiscordThread";
import TournamentBanner from "./info/TournamentBanner";
import TournamentWinners from "./info/TournamentWinners";
import TournamentReports from "./info/TournamentReports";
import TournamentVotings from "./info/TournamentVotings";
import { loggedInUserAtom } from "../../store/atoms";
import { useAtom } from "jotai";
import _ from "lodash";
import { useNavigate } from "react-router";
import { ITicket } from "../../../interfaces/Ticket";
import { IVoting } from "../../../interfaces/Voting";
import AlertText from "../common/AlertText";

interface IProps {
    tournament: ITournament;
    reports: ITicket[];
    votings: IVoting[];
}

export default function TournamentPageInfo({ tournament, reports, votings }: IProps) {
    const [user] = useAtom(loggedInUserAtom);
    const editTournamentMutation = useEditTournament(tournament._id);
    const deleteTournamentMutation = useDeleteTournament(tournament._id);
    const navigate = useNavigate();
    const confirmModal = useConfirmModal();

    const handleToggleState = async () => {
        const message = (
            <>
                <Text size="sm" mb="sm">
                    Are you sure you want to {tournament.isActive ? "archive" : "unarchive"} this {tournament.type}?
                </Text>
                {tournament.isActive && (
                    <AlertText text="Ensure the conclusion email is sent before archiving." type="warning" />
                )}
            </>
        );

        if (
            await confirmModal({
                title: `${tournament.isActive ? "Archive" : "Unarchive"} ${tournament.type}?`,
                children: message,
                confirmText: `${tournament.isActive ? "Archive" : "Unarchive"}`,
                confirmProps: {
                    leftSection: <FontAwesomeIcon icon="box-archive" />,
                    color: tournament.isActive ? "warning" : "success",
                },
            })
        ) {
            await editTournamentMutation.mutateAsync({ isActive: !tournament.isActive });
        }
    };

    const handleDelete = async () => {
        const confirmProps = {
            preset: "delete" as const,
            title: `Delete ${tournament.type}?`,
            text: `Are you sure you want to delete this ${tournament.type}? This action is irreversible.`,
        };
        if (await confirmModal(confirmProps)) {
            await deleteTournamentMutation.mutateAsync();
            navigate("/tournaments");
        }
    };

    return (
        <Card shadow="sm" p="lg" radius="md">
            <Stack gap="lg">
                <Group justify="space-between" align="center">
                    <Title order={3}>{_.capitalize(tournament.type)} Information</Title>
                    {user?.isAdmin && (
                        <Group gap="xs">
                            {tournament.status === "supportRequestReceived" && (
                                <Button
                                    variant="filled"
                                    color="danger"
                                    onClick={handleDelete}
                                    leftSection={<FontAwesomeIcon icon="trash" />}>
                                    Delete
                                </Button>
                            )}
                            <Button
                                variant={tournament.isActive ? "filled" : "outline"}
                                color="warning"
                                onClick={handleToggleState}
                                loading={editTournamentMutation.isPending}
                                leftSection={<FontAwesomeIcon icon="box-archive" />}>
                                {tournament.isActive ? "Archive" : "Unarchive"}
                            </Button>
                        </Group>
                    )}
                </Group>

                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" verticalSpacing="lg">
                    <TournamentStatus tournament={tournament} />
                    <TournamentBanner tournament={tournament} />
                    <TournamentDates tournament={tournament} />
                    <TournamentForumUrl tournament={tournament} />
                    {user?.isCommitteeOrAdmin && <TournamentEnchantUrl tournament={tournament} />}
                    {user?.isCommitteeOrAdmin && <TournamentDiscordThread tournament={tournament} />}
                    {user?.isCommitteeOrAdmin && <TournamentReports reports={reports} />}
                    {user?.isCommitteeOrAdmin && <TournamentVotings votings={votings} />}
                    <TournamentWinners tournament={tournament} />
                    <TournamentTags tournament={tournament} />
                </SimpleGrid>

                <Stack gap="md">
                    <TournamentBadges tournament={tournament} />
                </Stack>
            </Stack>
        </Card>
    );
}
