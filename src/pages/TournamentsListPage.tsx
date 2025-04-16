import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
    Stack,
    Group,
    Button,
    Card,
    Text,
    Pagination,
    Skeleton,
    SimpleGrid,
    Divider,
    Table,
    ScrollArea,
} from "@mantine/core";
import { useDebouncedValue, useDisclosure } from "@mantine/hooks";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ITournament, GameMode, TournamentType, TournamentStatus } from "../../interfaces/Tournament";
import TournamentFilters from "../components/tournaments/TournamentFilters";
import TournamentCard from "../components/tournaments/TournamentCard";
import TournamentTable from "../components/tournaments/TournamentTable";
import TournamentCreateModal from "../components/tournaments/TournamentCreateModal";
import { useTournaments } from "../hooks/useTournaments";
import { loggedInUserAtom, tournamentViewModeAtom } from "../store/atoms";
import { useAtom } from "jotai";

interface FilterValues {
    name: string;
    mode: GameMode;
    host: string;
    type: TournamentType | "";
    status: TournamentStatus | "";
    state: string;
    showAllAssignedReviews: boolean;
}

function LoadingState({ viewMode }: { viewMode: "cards" | "table" }) {
    if (viewMode === "cards") {
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

    return (
        <Card shadow="sm" p="lg">
            <ScrollArea>
                <Table>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Type</Table.Th>
                            <Table.Th>Mode</Table.Th>
                            <Table.Th>Name</Table.Th>
                            <Table.Th>Host</Table.Th>
                            <Table.Th>Status</Table.Th>
                            <Table.Th>State</Table.Th>
                            <Table.Th>Thread</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {Array.from({ length: 10 }).map((_, i) => (
                            <Table.Tr key={i}>
                                <Table.Td>
                                    <Skeleton height={20} width={40} />
                                </Table.Td>
                                <Table.Td>
                                    <Skeleton height={20} width={40} />
                                </Table.Td>
                                <Table.Td>
                                    <Skeleton height={20} width={200} />
                                </Table.Td>
                                <Table.Td>
                                    <Skeleton height={20} width={120} />
                                </Table.Td>
                                <Table.Td>
                                    <Skeleton height={20} width={100} />
                                </Table.Td>
                                <Table.Td>
                                    <Skeleton height={20} width={80} />
                                </Table.Td>
                                <Table.Td ta="center">
                                    <Group justify="center">
                                        <Skeleton height={20} width={20} />
                                    </Group>
                                </Table.Td>
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>
            </ScrollArea>
        </Card>
    );
}

export default function TournamentListPage() {
    const [user] = useAtom(loggedInUserAtom);
    const [searchParams, setSearchParams] = useSearchParams();
    const [page, setPage] = useState(() => Number(searchParams.get("page")) || 1);
    const [viewMode] = useAtom(tournamentViewModeAtom);
    const [filters, setFilters] = useState<FilterValues>({
        name: searchParams.get("name") || "",
        mode: (searchParams.get("mode") as GameMode) || "",
        host: searchParams.get("host") || "",
        type: (searchParams.get("type") as TournamentType) || "",
        status: (searchParams.get("status") as TournamentStatus) || "",
        state: searchParams.get("state") || "",
        showAllAssignedReviews: searchParams.get("showAllAssignedReviews") === "true" || false,
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
        showAllAssignedReviews: filters.showAllAssignedReviews,
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
        if (filters.showAllAssignedReviews)
            params.set("showAllAssignedReviews", filters.showAllAssignedReviews.toString());
        if (page > 1) params.set("page", page.toString());
        setSearchParams(params);
    }, [
        debouncedName,
        debouncedHost,
        filters.mode,
        filters.type,
        filters.status,
        filters.state,
        filters.showAllAssignedReviews,
        page,
        setSearchParams,
    ]);

    // Reset pagination when debounced values or other filter values change
    useEffect(() => {
        setPage(1);
    }, [
        debouncedName,
        debouncedHost,
        filters.mode,
        filters.type,
        filters.status,
        filters.state,
        filters.showAllAssignedReviews,
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
                <LoadingState viewMode={viewMode} />
            ) : !data || data.tournaments.length === 0 ? (
                <EmptyState hasError={false} />
            ) : (
                <Stack gap="md">
                    {viewMode === "cards" ? (
                        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
                            {data.tournaments.map((tournament: ITournament) => (
                                <TournamentCard key={tournament._id} tournament={tournament} />
                            ))}
                        </SimpleGrid>
                    ) : (
                        <TournamentTable tournaments={data.tournaments} />
                    )}
                    {data.pages > 1 && (
                        <Group justify="center" mt="xs">
                            <Pagination value={page} onChange={setPage} total={data.pages} color="primary" mt="sm" />
                        </Group>
                    )}
                </Stack>
            )}
        </Stack>
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
