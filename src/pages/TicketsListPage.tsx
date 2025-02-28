import { useEffect, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { useTickets } from "../hooks/useTickets";
import { UserGroup } from "../../interfaces/User";
import { ITicket } from "../../interfaces/Ticket";
import { Stack, Card, SimpleGrid, Group, Pagination, Text, Skeleton, Divider } from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import TicketCard from "../components/tickets/TicketCard";
import TicketsFilters from "../components/tickets/TicketsFilters";

interface FilterValues {
    title: string;
    targetUser: string;
    targetTournament: string;
    assignedGroup: UserGroup;
    status: string;
    showOwn: boolean;
}

export default function TicketsListPage() {
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    const [page, setPage] = useState(() => Number(searchParams.get("page")) || 1);
    const type = location.pathname.includes("/reports") ? "report" : "ticket";

    const [searchInput, setSearchInput] = useState<FilterValues>({
        title: searchParams.get("title") || "",
        targetUser: searchParams.get("targetUser") || "",
        targetTournament: searchParams.get("targetTournament") || "",
        assignedGroup: (searchParams.get("assignedGroup") as UserGroup) || "",
        status: searchParams.get("status") || "",
        showOwn: searchParams.get("showOwn") === "true",
    });

    const [debouncedTitle] = useDebouncedValue(searchInput.title, 400);
    const [debouncedTournament] = useDebouncedValue(searchInput.targetTournament, 400);

    const handleFilterChange = (newFilters) => {
        setSearchInput(newFilters);
        setPage(1);
    };

    const { data, isLoading, error } = useTickets({
        type,
        title: debouncedTitle,
        targetUser: searchInput.targetUser,
        targetTournament: debouncedTournament,
        assignedGroup: searchInput.assignedGroup,
        isActive: searchInput.status ? searchInput.status === "active" : undefined,
        showOwn: searchInput.showOwn,
        page,
    });

    // Handle URL params
    useEffect(() => {
        const params = new URLSearchParams();
        if (type === "ticket") {
            if (debouncedTitle) params.set("title", debouncedTitle);
            if (searchInput.showOwn) params.set("showOwn", "true");
        } else {
            if (searchInput.targetUser) params.set("targetUser", searchInput.targetUser);
            if (debouncedTournament) params.set("targetTournament", debouncedTournament);
        }
        if (searchInput.assignedGroup) params.set("assignedGroup", searchInput.assignedGroup);
        if (searchInput.status) params.set("status", searchInput.status);
        if (page > 1) params.set("page", page.toString());
        setSearchParams(params, { replace: true });
    }, [
        debouncedTitle,
        debouncedTournament,
        searchInput.targetUser,
        searchInput.targetTournament,
        searchInput.assignedGroup,
        searchInput.status,
        searchInput.showOwn,
        page,
        setSearchParams,
        type,
    ]);

    const LoadingState = () => (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
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
    );

    const EmptyState = ({ hasError }: { hasError: boolean }) => (
        <Stack align="center" justify="center" h={200}>
            <FontAwesomeIcon icon={type === "ticket" ? "paper-plane" : "flag"} size="2x" style={{ opacity: 0.5 }} />
            <Text size="lg" c="dimmed">
                {hasError ? `Error loading ${type}s` : `No ${type}s found`}
            </Text>
            <Text size="sm" c="dimmed">
                {hasError ? "Try refreshing the page" : "Try adjusting your filters"}
            </Text>
        </Stack>
    );

    return (
        <Stack gap="md">
            <TicketsFilters values={searchInput} onChange={handleFilterChange} type={type} />

            <Divider />

            {isLoading ? (
                <LoadingState />
            ) : !data || data.tickets.length === 0 ? (
                <EmptyState hasError={!!error} />
            ) : (
                <Stack gap="md">
                    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
                        {data.tickets.map((ticket: ITicket) => (
                            <TicketCard key={ticket._id} ticket={ticket} />
                        ))}
                    </SimpleGrid>

                    {data.pages > 1 && (
                        <Group justify="center" mt="xl">
                            <Pagination value={page} onChange={setPage} total={data.pages} />
                        </Group>
                    )}
                </Stack>
            )}
        </Stack>
    );
}
