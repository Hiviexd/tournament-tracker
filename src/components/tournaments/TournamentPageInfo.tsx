import { Stack, Group, Title, Button, Card, SimpleGrid } from "@mantine/core";
import { ITournament } from "../../../interfaces/Tournament";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useDeleteTournament, useEditTournament } from "../../hooks/useTournaments";
import TournamentStatus from "./info/TournamentStatus";
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

    const handleToggleState = async () => {
        let message = `Are you sure you want to ${tournament.isActive ? "archive" : "unarchive"} this tournament?`;
        if (tournament.isActive) {
            message += "\n\nPlease ensure that the conclusion email is sent before archiving.";
        }

        if (confirm(message)) {
            await editTournamentMutation.mutateAsync({ isActive: !tournament.isActive });
        }
    };

    const handleDelete = async () => {
        if (confirm("Are you sure you want to delete this tournament? This action is irreversible.")) {
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
                                leftSection={<FontAwesomeIcon icon="box-archive" />}>
                                {tournament.isActive ? "Archive" : "Unarchive"}
                            </Button>
                        </Group>
                    )}
                </Group>

                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                    <TournamentStatus tournament={tournament} />
                    <TournamentBanner tournament={tournament} />
                    <TournamentDates tournament={tournament} />
                    <TournamentForumUrl tournament={tournament} />
                    {(user?.isCommittee || user?.isAdmin) && <TournamentEnchantUrl tournament={tournament} />}
                    {(user?.isCommittee || user?.isAdmin) && <TournamentDiscordThread tournament={tournament} />}
                    {(user?.isCommittee || user?.isAdmin) && <TournamentReports reports={reports} />}
                    {(user?.isCommittee || user?.isAdmin) && <TournamentVotings votings={votings} />}
                    <TournamentWinners tournament={tournament} />
                </SimpleGrid>

                <Stack gap="md">
                    <TournamentBadges tournament={tournament} />
                </Stack>
            </Stack>
        </Card>
    );
}
