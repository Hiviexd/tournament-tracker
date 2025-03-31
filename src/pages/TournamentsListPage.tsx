import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Stack, Group, Button, Card, Text, Pagination, Skeleton, SimpleGrid, Divider } from "@mantine/core";
import { useDebouncedValue, useDisclosure } from "@mantine/hooks";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ITournament, GameMode, TournamentType, TournamentStatus } from "../../interfaces/Tournament";
import TournamentFilters from "../components/tournaments/TournamentFilters";
import TournamentCard from "../components/tournaments/TournamentCard";
import TournamentCreateModal from "../components/tournaments/TournamentCreateModal";
import { useTournaments } from "../hooks/useTournaments";
import { loggedInUserAtom } from "../store/atoms";
import { useAtom } from "jotai";

interface FilterValues {
    name: string;
    mode: GameMode;
    host: string;
    type: TournamentType | "";
    status: TournamentStatus | "";
    state: string;
    showNeedsAttention: boolean;
}

export default function TournamentListPage() {
    const [user] = useAtom(loggedInUserAtom);
    const [searchParams, setSearchParams] = useSearchParams();
    const [page, setPage] = useState(() => Number(searchParams.get("page")) || 1);
    const [filters, setFilters] = useState<FilterValues>({
        name: searchParams.get("name") || "",
        mode: (searchParams.get("mode") as GameMode) || "",
        host: searchParams.get("host") || "",
        type: (searchParams.get("type") as TournamentType) || "",
        status: (searchParams.get("status") as TournamentStatus) || "",
        state: searchParams.get("state") || "",
        showNeedsAttention: searchParams.get("showNeedsAttention") === "true" || false,
    });
    const [opened, { open, close }] = useDisclosure(false);
    const [debouncedName] = useDebouncedValue(filters.name, 400);
    const [debouncedHost] = useDebouncedValue(filters.host, 400);

    const { data, isLoading } = useTournaments({
        name: debouncedName,
        mode: filters.mode,
        host: debouncedHost,
        type: filters.type,
        status: filters.status,
        state: filters.state,
        showNeedsAttention: filters.showNeedsAttention,
        page,
    });

    // Update URL params
    useEffect(() => {
        const params = new URLSearchParams();
        if (debouncedName) params.set("name", debouncedName);
        if (filters.mode) params.set("mode", filters.mode);
        if (debouncedHost) params.set("host", debouncedHost);
        if (filters.type) params.set("type", filters.type);
        if (filters.status) params.set("status", filters.status);
        if (filters.state) params.set("state", filters.state);
        if (filters.showNeedsAttention) params.set("needsAttention", filters.showNeedsAttention.toString());
        if (page > 1) params.set("page", page.toString());
        setSearchParams(params);
    }, [
        debouncedName,
        debouncedHost,
        filters.mode,
        filters.type,
        filters.status,
        filters.state,
        filters.showNeedsAttention,
        page,
        setSearchParams,
    ]);

    return (
        <Stack gap="md">
            <TournamentFilters values={filters} onChange={setFilters} />

            {user?.isCommittee && (
                <Button
                    onClick={open}
                    leftSection={<FontAwesomeIcon icon="plus" />}
                    variant="filled"
                    color="primary"
                    fullWidth>
                    New Tournament
                </Button>
            )}

            <TournamentCreateModal opened={opened} onClose={close} />

            <Divider />

            {isLoading ? (
                <LoadingState />
            ) : !data || data.tournaments.length === 0 ? (
                <EmptyState hasError={false} />
            ) : (
                <Stack gap="md">
                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
                        {data.tournaments.map((tournament: ITournament) => (
                            <TournamentCard key={tournament._id} tournament={tournament} />
                        ))}
                    </SimpleGrid>
                    {data.pages > 1 && (
                        <Pagination value={page} onChange={setPage} total={data.pages} color="primary" mt="sm" />
                    )}
                </Stack>
            )}
        </Stack>
    );
}

function LoadingState() {
    return (
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
            {[1, 2, 3, 4].map((i) => (
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
                                <Skeleton height={24} width={200} /> {/* Title */}
                                <Group gap="xs" my="sm">
                                    <Skeleton circle height={30} width={30} /> {/* Avatar */}
                                    <Skeleton height={16} width={120} /> {/* Host */}
                                </Group>
                            </Stack>
                            <Skeleton height={20} width={80} radius="xl" /> {/* Active/Concluded Badge */}
                        </Group>

                        <Group gap="xs">
                            <Skeleton height={20} width={28} radius="xl" /> {/* Type Badge */}
                            <Skeleton height={20} width={28} radius="xl" /> {/* Mode Badge */}
                            <Skeleton height={20} width={100} radius="xl" /> {/* Status Badge */}
                            <Skeleton height={20} width={80} radius="xl" /> {/* Vote Count Badge */}
                        </Group>
                    </Stack>
                </Card>
            ))}
        </SimpleGrid>
    );
}

function EmptyState({ hasError }: { hasError: boolean }) {
    return (
        <Stack align="center" justify="center" h={200}>
            <FontAwesomeIcon icon="trophy" size="2x" style={{ opacity: 0.5 }} />
            <Text size="lg" c="dimmed">
                {hasError ? "Error loading tournaments" : "No tournaments found"}
            </Text>
            <Text size="sm" c="dimmed">
                {hasError ? "Try refreshing the page" : "Try adjusting your filters"}
            </Text>
        </Stack>
    );
}
