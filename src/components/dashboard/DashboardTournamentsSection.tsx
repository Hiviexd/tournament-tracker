import { Stack, Title, Group, Text, SimpleGrid, Badge } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import TournamentCard from "../tournaments/TournamentCard";
import { ITournament } from "../../../interfaces/Tournament";
import { IUser } from "../../../interfaces/User";
import EmptyState from "../common/EmptyState";
import _ from "lodash";

interface IProps {
    tournaments: ITournament[];
    user: IUser | null;
}

export default function DashboardTournamentsSection({ tournaments, user }: IProps) {
    const typeString = user?.isTournamentCommittee ? "tournaments" : "contests";

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

    return (
        <Stack gap="md">
            <Title order={3} className="header-border-left">
                {_.capitalize(typeString)}
            </Title>

            {tournamentsNeedingReview.length > 0 || otherTournaments.length > 0 ? (
                <>
                    <Stack gap="sm">
                        <Group align="center" gap="xs">
                            <Title order={4} c={tournamentsNeedingReview.length > 0 ? "orange" : "white"}>
                                Needs Your Review
                            </Title>
                            <Badge color={tournamentsNeedingReview.length > 0 ? "orange" : "gray"} variant="light">
                                {tournamentsNeedingReview.length}
                            </Badge>
                        </Group>
                        {tournamentsNeedingReview.length > 0 ? (
                            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                                {tournamentsNeedingReview.map((tournament) => (
                                    <TournamentCard key={tournament.id} tournament={tournament} />
                                ))}
                            </SimpleGrid>
                        ) : (
                            <Group gap="xs" pl="md">
                                <FontAwesomeIcon icon="check-double" style={{ opacity: 0.5 }} />
                                <Text size="sm" c="dimmed">
                                    All clear!
                                </Text>
                            </Group>
                        )}
                    </Stack>

                    <Stack gap="sm">
                        <Group align="center" gap="xs">
                            <Title order={4}>Other Assigned {_.capitalize(typeString)}</Title>
                            <Badge color="gray" variant="light">
                                {otherTournaments.length}
                            </Badge>
                        </Group>
                        {otherTournaments.length > 0 ? (
                            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                                {otherTournaments.map((tournament) => (
                                    <TournamentCard key={tournament.id} tournament={tournament} />
                                ))}
                            </SimpleGrid>
                        ) : (
                            <Group gap="xs" pl="md">
                                <FontAwesomeIcon icon="check-double" style={{ opacity: 0.5 }} />
                                <Text size="sm" c="dimmed">
                                    All clear!
                                </Text>
                            </Group>
                        )}
                    </Stack>
                </>
            ) : (
                <EmptyState
                    height={100}
                    icon="trophy"
                    title={`All ${typeString} are clear!`}
                    description="Hello shdewz, we meet again."
                />
            )}
        </Stack>
    );
}
