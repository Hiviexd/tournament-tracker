import { useEffect } from "react";
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
import { useDisclosure } from "@mantine/hooks";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ITournament, GameMode, TournamentType, TournamentStatus } from "../../interfaces/Tournament";
import TournamentFilters from "../components/tournaments/TournamentFilters";
import TournamentCard from "../components/tournaments/TournamentCard";
import TournamentTable from "../components/tournaments/TournamentTable";
import TournamentCreateModal from "../components/tournaments/TournamentCreateModal";
import { useTournaments } from "../hooks/useTournaments";
import { loggedInUserAtom, tournamentViewModeAtom } from "../store/atoms";
import { useAtom } from "jotai";
import { IUser } from "../../interfaces/User";
import TournamentReviewBoard from "../components/tournaments/TournamentReviewBoard";
import { getSavedPreference } from "../hooks/useLocalPreferences";
import { useQueryStates, parseAsString, parseAsInteger, parseAsBoolean } from "nuqs";

interface FilterValues {
    search: string;
    mode: GameMode;
    host: string;
    type: TournamentType | "";
    status: TournamentStatus | "";
    state: string;
    showAllAssignedReviews: boolean;
}

function LoadingState({ viewMode, user }: { viewMode: "cards" | "table" | "review"; user: IUser | null }) {
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
                            {viewMode === "review" ? (
                                <>
                                    <Table.Th>Tournament Name</Table.Th>
                                    <Table.Th>Reviewer 1</Table.Th>
                                    <Table.Th>Reviewer 2</Table.Th>
                                    <Table.Th>Review Start Date</Table.Th>
                                </>
                            ) : (
                                <>
                                    <Table.Th>Type</Table.Th>
                                    <Table.Th>Mode</Table.Th>
                                    <Table.Th>Name</Table.Th>
                                    <Table.Th>Host</Table.Th>
                                    <Table.Th>Status</Table.Th>
                                    <Table.Th>State</Table.Th>
                                </>
                            )}
                            {user && user.isCommittee && <Table.Th>Thread</Table.Th>}
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {Array.from({ length: 10 }).map((_, i) => (
                            <Table.Tr key={i}>
                                {viewMode === "review" ? (
                                    <>
                                        <Table.Td>
                                            <Skeleton height={20} width={200} />
                                        </Table.Td>
                                        <Table.Td>
                                            <Skeleton height={20} width={120} />
                                        </Table.Td>
                                        <Table.Td>
                                            <Skeleton height={20} width={120} />
                                        </Table.Td>
                                        <Table.Td>
                                            <Skeleton height={20} width={100} />
                                        </Table.Td>
                                    </>
                                ) : (
                                    <>
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
                                    </>
                                )}
                                {user && user.isCommittee && (
                                    <Table.Td ta="center">
                                        <Group justify="center">
                                            <Skeleton height={20} width={20} />
                                        </Group>
                                    </Table.Td>
                                )}
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
    const automaticTypeFilter = getSavedPreference<boolean>("automatic_type_filter", true);

    const getTypeFilterFromUser = () => {
        if (!user?.isCommittee || !automaticTypeFilter) return "";
        if (user?.isTournamentCommittee) return "tournament";
        if (user?.isContestCommittee) return "contest";
        return "";
    };

    // Define query state parsers with default values
    const [queryState, setQueryState] = useQueryStates(
        {
            search: parseAsString.withDefault(""),
            mode: parseAsString.withDefault(""),
            host: parseAsString.withDefault(""),
            type: parseAsString.withDefault(getTypeFilterFromUser()),
            status: parseAsString.withDefault(""),
            state: parseAsString.withDefault(""),
            showAllAssignedReviews: parseAsBoolean.withDefault(false),
            page: parseAsInteger.withDefault(1),
        },
        {
            // Only include non-default values in URL
            clearOnDefault: true,
        }
    );

    const [viewMode, setViewMode] = useAtom(tournamentViewModeAtom);
    const [opened, { open, close }] = useDisclosure(false);

    // Create filters object for TournamentFilters component
    const filters: FilterValues = {
        search: queryState.search,
        mode: queryState.mode as GameMode,
        host: queryState.host,
        type: queryState.type as TournamentType | "",
        status: queryState.status as TournamentStatus | "",
        state: queryState.state,
        showAllAssignedReviews: queryState.showAllAssignedReviews,
    };

    const { data, isLoading } = useTournaments({
        search: queryState.search,
        mode: queryState.mode as GameMode,
        host: queryState.host,
        type: viewMode === "review" ? "tournament" : (queryState.type as TournamentType),
        status: viewMode === "review" ? "reviewOngoing" : (queryState.status as TournamentStatus),
        state: queryState.state,
        showAllAssignedReviews: queryState.showAllAssignedReviews,
        page: queryState.page,
    });

    // Handle filter changes - automatically reset page to 1 when filters change
    const handleFiltersChange = (newFilters: FilterValues) => {
        // Check if any filter (except page) has changed
        const filterChanged =
            newFilters.search !== filters.search ||
            newFilters.mode !== filters.mode ||
            newFilters.host !== filters.host ||
            newFilters.type !== filters.type ||
            newFilters.status !== filters.status ||
            newFilters.state !== filters.state ||
            newFilters.showAllAssignedReviews !== filters.showAllAssignedReviews;

        setQueryState({
            search: newFilters.search,
            mode: newFilters.mode,
            host: newFilters.host,
            type: newFilters.type,
            status: newFilters.status,
            state: newFilters.state,
            showAllAssignedReviews: newFilters.showAllAssignedReviews,
            // Reset page to 1 only when filters change, not on page load
            page: filterChanged ? 1 : queryState.page,
        });
    };

    // Handle page changes
    const handlePageChange = (newPage: number) => {
        setQueryState({ page: newPage });
    };

    // Reset view mode to table if user is not in committee and current mode is review
    useEffect(() => {
        if (viewMode === "review" && !user?.isCommittee) {
            setViewMode("table");
        }
    }, [viewMode, user?.isCommittee, setViewMode]);

    return (
        <Stack gap="md">
            <TournamentFilters values={filters} onChange={handleFiltersChange} />

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
                <LoadingState viewMode={viewMode} user={user} />
            ) : !data || data.tournaments.length === 0 ? (
                <EmptyState hasError={false} />
            ) : (
                <Stack gap="md">
                    {viewMode === "review" ? (
                        <TournamentReviewBoard tournaments={data.tournaments} />
                    ) : viewMode === "table" ? (
                        <TournamentTable tournaments={data.tournaments} total={data.total} currentPage={data.page} />
                    ) : (
                        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
                            {data.tournaments.map((tournament: ITournament) => (
                                <TournamentCard key={tournament._id} tournament={tournament} />
                            ))}
                        </SimpleGrid>
                    )}
                    {data.pages > 1 && (
                        <Group justify="center" mt="xs">
                            <Pagination
                                value={queryState.page}
                                onChange={handlePageChange}
                                total={data.pages}
                                color="primary"
                                mt="sm"
                            />
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
