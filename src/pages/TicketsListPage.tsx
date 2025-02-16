// Base
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useTickets } from "../hooks/useTickets";
import { UserGroup } from "../../interfaces/User";
import { ITicket } from "../../interfaces/Ticket";

// Mantine
import { Stack, Tabs, Card, SimpleGrid, Group, Pagination, Text, Skeleton, Divider } from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

// Components
import TicketCard from "../components/tickets/TicketCard";
import TicketsFilters from "../components/tickets/TicketsFilters";

interface FilterValues {
    title: string;
    assignedGroup: UserGroup;
    status: string;
}

export default function TicketsListPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    const [page, setPage] = useState(() => Number(searchParams.get("page")) || 1);

    const initialTab = location.pathname.includes("/reports") ? "reports" : "tickets";
    const [activeTab, setActiveTab] = useState<"tickets" | "reports">(initialTab);
    const [searchInput, setSearchInput] = useState<FilterValues>({
        title: searchParams.get("title") || "",
        assignedGroup: (searchParams.get("assignedGroup") as UserGroup) || "",
        status: searchParams.get("status") || "",
    });
    const [debouncedTitle] = useDebouncedValue(searchInput.title, 400);

    // Handle tab changes
    useEffect(() => {
        const newTab = location.pathname.includes("/reports") ? "reports" : "tickets";
        setActiveTab(newTab);
    }, [location.pathname]);

    const handleTabChange = (value: string | null) => {
        const newTab = (value ?? "tickets") as "tickets" | "reports";
        setActiveTab(newTab);
        navigate(newTab === "tickets" ? "/tickets" : "/reports", { replace: true });
    };

    // Handle URL params
    useEffect(() => {
        const params = new URLSearchParams();
        if (debouncedTitle) params.set("title", debouncedTitle);
        if (searchInput.assignedGroup) params.set("assignedGroup", searchInput.assignedGroup);
        if (searchInput.status) params.set("status", searchInput.status);
        if (page > 1) params.set("page", page.toString());
        setSearchParams(params);
    }, [debouncedTitle, searchInput.assignedGroup, searchInput.status, page, setSearchParams]);

    // Reset page when filters change
    useEffect(() => {
        setPage(1);
    }, [debouncedTitle, searchInput.assignedGroup, searchInput.status]);

    const { data, isLoading, error } = useTickets({
        type: activeTab === "tickets" ? "ticket" : "report",
        title: debouncedTitle,
        assignedGroup: searchInput.assignedGroup,
        isActive: searchInput.status ? searchInput.status === "active" : undefined,
        page,
    });

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
                            <Stack gap="xs">
                                <Skeleton height={24} width="80%" />
                                <Skeleton height={16} width={120} />
                            </Stack>
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
            <FontAwesomeIcon
                icon={activeTab === "tickets" ? "ticket-alt" : "flag"}
                size="2x"
                style={{ opacity: 0.5 }}
            />
            <Text size="lg" c="dimmed">
                {hasError ? `Error loading ${activeTab}` : `No ${activeTab} found`}
            </Text>
            <Text size="sm" c="dimmed">
                {hasError ? "Try refreshing the page" : "Try adjusting your filters"}
            </Text>
        </Stack>
    );

    return (
        <Stack gap="md">
            <Tabs color="primary.6" value={activeTab} onChange={handleTabChange}>
                <Stack gap="md">
                    <Tabs.List>
                        <Tabs.Tab value="reports">Reports</Tabs.Tab>
                        <Tabs.Tab value="tickets">Tickets</Tabs.Tab>
                    </Tabs.List>

                    <TicketsFilters values={searchInput} onChange={setSearchInput} />

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
            </Tabs>
        </Stack>
    );
}
