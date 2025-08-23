import { Stack, Title, Group, Text, SimpleGrid } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import TournamentCard from "../tournaments/TournamentCard";
import { ITournament } from "../../../interfaces/Tournament";
import { IUser } from "../../../interfaces/User";

interface IProps {
    tournaments: ITournament[];
    user: IUser | null;
}

export default function DashboardTournamentsSection({ tournaments, user }: IProps) {
    const checkTournamentNeedsReview = (tournament: ITournament, user: IUser | null): boolean => {
        if (!user) return false;

        // Check if user is assigned
        const isAssigned = tournament.assignedReviewers?.some((reviewer) => reviewer._id === user._id);
        if (!isAssigned) return false;

        // Check if tournament is in review state
        if (tournament.status !== "reviewOngoing" && tournament.status !== "changesRequested") return false;

        // Check if user has already submitted a review
        const hasSubmittedReview = tournament.reviews?.some((review) => review.author?._id === user._id);
        return !hasSubmittedReview;
    };

    // Group tournaments
    const tournamentsNeedingReview = tournaments.filter((tournament) => checkTournamentNeedsReview(tournament, user));
    const otherTournaments = tournaments.filter((tournament) => !checkTournamentNeedsReview(tournament, user));

    if (tournamentsNeedingReview.length === 0 && otherTournaments.length === 0) {
        return null;
    }

    return (
        <Stack gap="md">
            <Title order={3}>Tournaments</Title>

            <Stack gap="sm">
                <Group align="center" gap="xs">
                    <Title order={4} c="orange">
                        Needs Your Review
                    </Title>
                    <Text c="dimmed">({tournamentsNeedingReview.length})</Text>
                </Group>
                {tournamentsNeedingReview.length > 0 ? (
                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                        {tournamentsNeedingReview.map((tournament) => (
                            <TournamentCard key={tournament._id} tournament={tournament} />
                        ))}
                    </SimpleGrid>
                ) : (
                    <Group gap="xs" pl="md">
                        <FontAwesomeIcon icon="ghost" style={{ opacity: 0.5 }} />
                        <Text size="sm" c="dimmed">
                            Nothing here...
                        </Text>
                    </Group>
                )}
            </Stack>

            <Stack gap="sm">
                <Group align="center" gap="xs">
                    <Title order={4}>Other Assigned Tournaments</Title>
                    <Text c="dimmed">({otherTournaments.length})</Text>
                </Group>
                {otherTournaments.length > 0 ? (
                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                        {otherTournaments.map((tournament) => (
                            <TournamentCard key={tournament._id} tournament={tournament} />
                        ))}
                    </SimpleGrid>
                ) : (
                    <Group gap="xs" pl="md">
                        <FontAwesomeIcon icon="ghost" style={{ opacity: 0.5 }} />
                        <Text size="sm" c="dimmed">
                            Nothing here...
                        </Text>
                    </Group>
                )}
            </Stack>
        </Stack>
    );
}
