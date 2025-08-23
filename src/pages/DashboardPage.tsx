import { Stack, Title, Text, Card, SimpleGrid, Group, Skeleton, Divider } from "@mantine/core";
import { useAtom } from "jotai";
import { loggedInUserAtom } from "../store/atoms";
import { useDashboard } from "../hooks/useDashboard";
import EmptyState from "../components/common/EmptyState";
import DashboardTournamentsSection from "../components/dashboard/DashboardTournamentsSection";
import DashboardVotingsSection from "../components/dashboard/DashboardVotingsSection";
import DashboardReportsSection from "../components/dashboard/DashboardReportsSection";
import DashboardTicketsSection from "../components/dashboard/DashboardTicketsSection";

export default function DashboardPage() {
    const [user] = useAtom(loggedInUserAtom);
    const { data, isLoading, isError } = useDashboard();

    if (isLoading) {
        return <LoadingState />;
    }

    if (isError || !data) {
        return <EmptyState icon="home" title="Error loading dashboard" description="Try refreshing the page" />;
    }

    const { tournaments, votings, tickets, reports } = data;

    return (
        <Stack gap="xl">
            {/* Welcome Section */}
            <Card shadow="sm" p="lg">
                <Title order={2} mb="xs">
                    Hello {user?.username} 👋
                </Title>
                <Text c="dimmed">Let's catch up on what needs your attention in the Tournament Committee.</Text>
            </Card>

            {/* Dashboard Sections */}
            <DashboardTournamentsSection tournaments={tournaments} user={user} />
            <DashboardVotingsSection votings={votings} user={user} />
            <DashboardReportsSection reports={reports} />
            <DashboardTicketsSection tickets={tickets} />

            {/* Empty State when no data */}
            {tournaments.length === 0 && votings.length === 0 && tickets.length === 0 && reports.length === 0 && (
                <EmptyState icon="home" title="All caught up!" description="Nothing needs your attention right now." />
            )}
        </Stack>
    );
}

const LoadingState = () => (
    <Stack gap="xl">
        {/* Welcome Section Skeleton */}
        <Card shadow="sm" p="lg">
            <Skeleton height={28} width="40%" mb="xs" />
            <Skeleton height={16} width="80%" />
        </Card>

        {/* Tournaments Section Skeleton */}
        <Stack gap="md">
            <Skeleton height={24} width="30%" />
            <Stack gap="sm">
                <Skeleton height={20} width="25%" />
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                    {[1, 2].map((i) => (
                        <Card
                            key={i}
                            shadow="sm"
                            p={0}
                            radius="md"
                            className="tournament-card"
                            style={{ "--banner-url": "none" } as React.CSSProperties}>
                            <Stack gap="md" p="lg" className="tournament-card-content">
                                <Group justify="space-between" align="flex-start">
                                    <Stack gap="xs">
                                        <Skeleton height={24} width={200} />
                                        <Group gap="xs" my="sm">
                                            <Skeleton circle height={30} width={30} />
                                            <Skeleton height={16} width={120} />
                                        </Group>
                                    </Stack>
                                    <Skeleton height={20} width={80} radius="xl" />
                                </Group>
                                <Group gap="xs">
                                    <Skeleton height={20} width={100} radius="xl" />
                                    <Skeleton height={20} width={80} radius="xl" />
                                </Group>
                            </Stack>
                        </Card>
                    ))}
                </SimpleGrid>
            </Stack>
        </Stack>

        {/* Votings Section Skeleton */}
        <Stack gap="md">
            <Divider />
            <Skeleton height={24} width="25%" />
            <Stack gap="sm">
                <Skeleton height={20} width="20%" />
                <Stack gap="md">
                    {[1, 2].map((i) => (
                        <Card key={i} shadow="sm" p="lg">
                            <Skeleton height={24} width="40%" mb="xs" />
                            <Skeleton height={16} width="20%" mb="lg" />
                            <Skeleton height={16} width="70%" />
                        </Card>
                    ))}
                </Stack>
            </Stack>
        </Stack>

        {/* Reports/Tickets Section Skeleton */}
        <Stack gap="md">
            <Divider />
            <Skeleton height={24} width="20%" />
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
                {[1, 2, 3].map((i) => (
                    <Card
                        key={i}
                        shadow="sm"
                        p="lg"
                        radius="md"
                        className="ticket-card"
                        style={{
                            "--card-status-color": "var(--mantine-color-primary-6)",
                        }}>
                        <Stack gap="md" justify="space-between" style={{ height: "100%" }}>
                            <Stack gap="xs">
                                <Skeleton height={24} width="80%" />
                                <Skeleton height={16} width={120} />
                            </Stack>
                            <Group mt="auto">
                                <Skeleton height={22} width={40} radius="xl" />
                                <Skeleton height={22} width={40} radius="xl" />
                                <Skeleton height={22} width={40} radius="xl" />
                                <Skeleton height={22} width={80} radius="xl" />
                            </Group>
                        </Stack>
                    </Card>
                ))}
            </SimpleGrid>
        </Stack>
    </Stack>
);
