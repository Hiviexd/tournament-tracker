import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useTickets } from "../hooks/useTickets";
import { UserGroup, USER_GROUPS } from "@tc/types/User";
import { ITicket } from "@tc/types/Ticket";
import { Stack, Card, SimpleGrid, Group, Pagination, Text, Skeleton, Divider } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useQueryStates, parseAsString, parseAsInteger, parseAsBoolean } from "nuqs";
import TicketCard from "../components/tickets/TicketCard";
import TicketsFilters from "../components/tickets/TicketsFilters";
import { loggedInUserAtom } from "../store/atoms";
import { useAtom } from "jotai";
import { getSavedPreference } from "../hooks/useLocalPreferences";
import { pickStringUnion } from "@tc/utils/client";

function TicketsListLoadingState() {
    return (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
            {Array.from({ length: 12 }).map((_, i) => (
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
    );
}

function TicketsListEmptyState({
    type,
    hasError,
    showAdjustFilters,
}: {
    type: string;
    hasError: boolean;
    showAdjustFilters: boolean;
}) {
    return (
        <Stack align="center" justify="center" h={200}>
            <FontAwesomeIcon icon={type === "ticket" ? "paper-plane" : "flag"} size="2x" style={{ opacity: 0.5 }} />
            <Text size="lg" c="dimmed">
                {hasError ? `Error loading ${type}s` : `No ${type}s found...`}
            </Text>
            <Text size="sm" c="dimmed">
                {hasError ? "Try refreshing the page" : showAdjustFilters ? "Try adjusting your filters" : ""}
            </Text>
        </Stack>
    );
}

interface FilterValues {
    title: string;
    content: string;
    targetUser: string;
    targetTournament: string;
    assignedGroup: UserGroup | "";
    status: string;
    showOwn: boolean;
}

export default function TicketsListPage() {
    const [user] = useAtom(loggedInUserAtom);
    const automaticTypeFilter = getSavedPreference<boolean>("automatic_type_filter", true);

    const getTypeFilterFromUser = () => {
        if (!user?.isCommittee || !automaticTypeFilter) return "";
        if (user?.isTournamentCommittee) return "tc";
        if (user?.isContestCommittee) return "cc";
        return "";
    };

    const location = useLocation();
    const type = location.pathname.includes("/reports") ? "report" : "ticket";

    // Define query state parsers with default values
    const [queryState, setQueryState] = useQueryStates(
        {
            title: parseAsString.withDefault(""),
            content: parseAsString.withDefault(""),
            targetUser: parseAsString.withDefault(""),
            targetTournament: parseAsString.withDefault(""),
            assignedGroup: parseAsString.withDefault(getTypeFilterFromUser()),
            status: parseAsString.withDefault(""),
            showOwn: parseAsBoolean.withDefault(false),
            page: parseAsInteger.withDefault(1),
        },
        {
            // Only include non-default values in URL
            clearOnDefault: true,
        },
    );

    // Create filters object for TicketsFilters component
    const filters: FilterValues = {
        title: queryState.title,
        content: queryState.content,
        targetUser: queryState.targetUser,
        targetTournament: queryState.targetTournament,
        assignedGroup: pickStringUnion(queryState.assignedGroup, USER_GROUPS) ?? "",
        status: queryState.status,
        showOwn: queryState.showOwn,
    };

    // Track previous type to detect actual changes
    const prevType = useRef(type);

    // Reset pagination when type changes
    useEffect(() => {
        if (prevType.current !== type) {
            prevType.current = type;
            setQueryState({ page: 1 });
        }
    }, [type, setQueryState]);

    const handleFilterChange = (newFilters: FilterValues) => {
        // Check if any filter has changed to reset page
        const filterChanged =
            newFilters.title !== filters.title ||
            newFilters.content !== filters.content ||
            newFilters.targetUser !== filters.targetUser ||
            newFilters.targetTournament !== filters.targetTournament ||
            newFilters.assignedGroup !== filters.assignedGroup ||
            newFilters.status !== filters.status ||
            newFilters.showOwn !== filters.showOwn;

        setQueryState({
            title: newFilters.title,
            content: newFilters.content,
            targetUser: newFilters.targetUser,
            targetTournament: newFilters.targetTournament,
            assignedGroup: newFilters.assignedGroup,
            status: newFilters.status,
            showOwn: newFilters.showOwn,
            page: filterChanged ? 1 : queryState.page,
        });
    };

    const { data, isLoading, error } = useTickets({
        type,
        title: queryState.title,
        content: queryState.content,
        targetUser: queryState.targetUser,
        targetTournament: queryState.targetTournament,
        assignedGroup: pickStringUnion(queryState.assignedGroup, USER_GROUPS),
        isActive: queryState.status ? queryState.status === "active" : undefined,
        showOwn: queryState.showOwn,
        page: queryState.page,
    });

    // Handle page changes
    const handlePageChange = (newPage: number) => {
        setQueryState({ page: newPage });
    };

    return (
        <Stack gap="md">
            <TicketsFilters values={filters} onChange={handleFilterChange} type={type} />

            <Divider />

            {isLoading ? (
                <TicketsListLoadingState />
            ) : !data || data.tickets.length === 0 ? (
                <TicketsListEmptyState
                    type={type}
                    hasError={!!error}
                    showAdjustFilters={type === "ticket" || !!user?.isCommittee}
                />
            ) : (
                <Stack gap="md">
                    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
                        {data.tickets.map((ticket: ITicket) => (
                            <TicketCard key={ticket.id} ticket={ticket} />
                        ))}
                    </SimpleGrid>

                    {data.pages > 1 && (
                        <Group justify="center" mt="xs">
                            <Pagination value={queryState.page} onChange={handlePageChange} total={data.pages} />
                        </Group>
                    )}
                </Stack>
            )}
        </Stack>
    );
}
