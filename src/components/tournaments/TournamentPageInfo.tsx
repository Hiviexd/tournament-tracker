import { Stack, Group, Title, Button, Card } from "@mantine/core";
import { ITournament } from "../../../interfaces/Tournament";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEditTournament } from "../../hooks/useTournaments";
import TournamentStatus from "./info/TournamentStatus";
import TournamentDates from "./info/TournamentDates";
import TournamentBadges from "./info/TournamentBadges";
import TournamentForumUrl from "./info/TournamentForumUrl";

interface IProps {
    tournament: ITournament;
}

export default function TournamentPageInfo({ tournament }: IProps) {
    const editTournamentMutation = useEditTournament(tournament._id);

    const handleToggleState = async () => {
        if (confirm(`Are you sure you want to ${tournament.isActive ? "archive" : "unarchive"} this tournament?`)) {
            await editTournamentMutation.mutateAsync({ isActive: !tournament.isActive });
        }
    };

    return (
        <Card shadow="sm" p="lg" radius="md">
            <Stack gap="lg">
                <Group justify="space-between" align="center">
                    <Title order={3}>Tournament Information</Title>
                    <Button
                        variant="filled"
                        color={tournament.isActive ? "danger" : "warning"}
                        onClick={handleToggleState}
                        leftSection={<FontAwesomeIcon icon={tournament.isActive ? "archive" : "box-archive"} />}>
                        {tournament.isActive ? "Archive" : "Unarchive"}
                    </Button>
                </Group>

                <Stack gap="md">
                    <TournamentStatus tournament={tournament} />
                    <TournamentForumUrl tournament={tournament} />
                    <TournamentDates tournament={tournament} />
                    <TournamentBadges tournament={tournament} />
                </Stack>
            </Stack>
        </Card>
    );
}
