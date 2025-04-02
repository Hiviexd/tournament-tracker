import { Stack, Group, Title, Button, Card, SimpleGrid } from "@mantine/core";
import { ITournament } from "../../../interfaces/Tournament";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEditTournament } from "../../hooks/useTournaments";
import TournamentStatus from "./info/TournamentStatus";
import TournamentDates from "./info/TournamentDates";
import TournamentBadges from "./info/TournamentBadges";
import TournamentForumUrl from "./info/TournamentForumUrl";
import TournamentDiscordThread from "./info/TournamentDiscordThread";
import TournamentBanner from "./info/TournamentBanner";
import { loggedInUserAtom } from "../../store/atoms";
import { useAtom } from "jotai";
import _ from "lodash";

interface IProps {
    tournament: ITournament;
}

export default function TournamentPageInfo({ tournament }: IProps) {
    const [user] = useAtom(loggedInUserAtom);
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
                    <Title order={3}>{_.capitalize(tournament.type)} Information</Title>
                    {user?.isAdmin && (
                        <Button
                            variant="filled"
                            color={tournament.isActive ? "danger" : "warning"}
                            onClick={handleToggleState}
                            leftSection={<FontAwesomeIcon icon={tournament.isActive ? "archive" : "box-archive"} />}>
                            {tournament.isActive ? "Archive" : "Unarchive"}
                        </Button>
                    )}
                </Group>

                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                    <TournamentStatus tournament={tournament} />
                    <TournamentBanner tournament={tournament} />
                    <TournamentDates tournament={tournament} />
                    <TournamentForumUrl tournament={tournament} />
                    {(user?.isCommittee || user?.isAdmin) && <TournamentDiscordThread tournament={tournament} />}
                </SimpleGrid>

                <Stack gap="md">
                    <TournamentBadges tournament={tournament} />
                </Stack>
            </Stack>
        </Card>
    );
}
