import { useParams } from "react-router-dom";
import { Container, Stack, Card, Skeleton, Group } from "@mantine/core";
import TournamentPageHeader from "../components/tournaments/TournamentPageHeader";
import TournamentPageInfo from "../components/tournaments/TournamentPageInfo";
import TournamentReviewSection from "../components/tournaments/TournamentReviewSection";
import TournamentLogs from "../components/tournaments/TournamentLogs";
import { useTournament } from "../hooks/useTournaments";
import EmptyState from "../components/common/EmptyState";
import { loggedInUserAtom } from "../store/atoms";
import { useAtom } from "jotai";
import MappoolCompliancePage from "./MappoolCompliancePage";

export default function TournamentDetailsPage() {
    const [user] = useAtom(loggedInUserAtom);
    const { tournamentId } = useParams();
    const { data: tournament, isLoading } = useTournament(tournamentId!);

    const LoadingState = () => (
        <Stack gap="md">
            <Card shadow="sm" p={0}>
                <Skeleton height={200} radius="md" mb="md" /> {/* Banner */}
                <Stack p="lg" gap="md">
                    <Skeleton height={32} width="70%" /> {/* Title */}
                    <Skeleton height={20} width="40%" /> {/* Host */}
                    <Group gap="xs">
                        <Skeleton height={24} width={100} /> {/* Type Badge */}
                        <Skeleton height={24} width={100} /> {/* Mode Badge */}
                        <Skeleton height={24} width={150} /> {/* Date */}
                    </Group>
                </Stack>
            </Card>

            <Card shadow="sm" p="lg">
                <Skeleton height={24} width="30%" mb="lg" /> {/* Section Title */}
                <Stack gap="md">
                    <Skeleton height={36} width="40%" /> {/* Status */}
                    <Group grow>
                        <Stack gap="xs">
                            <Skeleton height={20} width="30%" /> {/* Start Date Label */}
                            <Skeleton height={20} width="60%" /> {/* Start Date */}
                        </Stack>
                        <Stack gap="xs">
                            <Skeleton height={20} width="30%" /> {/* End Date Label */}
                            <Skeleton height={20} width="60%" /> {/* End Date */}
                        </Stack>
                    </Group>
                </Stack>
            </Card>

            <Card shadow="sm" p="lg">
                <Skeleton height={24} width="20%" mb="lg" /> {/* Reviews Title */}
                <Skeleton height={16} width="40%" /> {/* Reviews Content */}
            </Card>
        </Stack>
    );

    if (!tournamentId) {
        return (
            <EmptyState
                icon="trophy"
                title="Tournament not found..."
                returnLink="/tournaments"
                returnText="Return to tournaments list"
            />
        );
    }

    return (
        <Container size="xl">
            {isLoading ? (
                <LoadingState />
            ) : tournament?.error ? (
                <EmptyState
                    icon="trophy"
                    title="Tournament not found..."
                    returnLink="/tournaments"
                    returnText="Return to tournaments list"
                />
            ) : (
                tournament && (
                    <Stack gap="xl">
                        <TournamentPageHeader tournament={tournament} />
                        <TournamentPageInfo tournament={tournament} />
                        {user?.isCommittee && <TournamentLogs tournament={tournament} />}
                        {user?.isCommittee && <TournamentReviewSection tournament={tournament} />}
                        {user?.isCommittee && tournament.isTournament && (
                            <MappoolCompliancePage header="Mappool Compliance Checker" />
                        )}
                    </Stack>
                )
            )}
        </Container>
    );
}
