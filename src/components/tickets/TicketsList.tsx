import { Card, SimpleGrid, Stack, Text, Group, Pagination, Skeleton } from "@mantine/core";
import { useTickets } from "../../hooks/useTickets";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useDebouncedValue } from "@mantine/hooks";
import { UserGroup } from "../../../interfaces/User";
import TicketCard from "./TicketCard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface ITicketsListProps {
    type: "ticket" | "report";
}

interface FilterValues {
    title: string;
    assignedGroup: UserGroup;
    status: string;
}

export default function TicketsList({ type }: ITicketsListProps) {
    const [searchParams, setSearchParams] = useSearchParams();
    const [page, setPage] = useState(() => Number(searchParams.get("page")) || 1);
    const [searchInput] = useState<FilterValues>({
        title: searchParams.get("title") || "",
        assignedGroup: (searchParams.get("assignedGroup") as UserGroup) || "",
        status: searchParams.get("status") || "",
    });
    const [debouncedTitle] = useDebouncedValue(searchInput.title, 400);

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
        type,
        title: debouncedTitle,
        assignedGroup: searchInput.assignedGroup,
        isActive: searchInput.status === "active",
        page,
    });

    const LoadingState = () => (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
            {[1, 2, 3].map((i) => (
                <Card key={i} shadow="sm" p="lg">
                    <Stack gap="md">
                        <Group justify="space-between">
                            <Stack gap="xs">
                                <Skeleton height={24} width="60%" />
                                <Skeleton height={16} width="40%" />
                            </Stack>
                            <Skeleton height={24} width={80} radius="xl" />
                        </Group>
                        <Group>
                            <Skeleton height={24} width={100} radius="xl" />
                            <Skeleton height={24} width={120} radius="xl" />
                        </Group>
                    </Stack>
                </Card>
            ))}
        </SimpleGrid>
    );

    const EmptyState = ({ hasError }: { hasError: boolean }) => (
        <Stack align="center" justify="center" h={200}>
            <FontAwesomeIcon icon={type === "ticket" ? "ticket-alt" : "flag"} size="2x" style={{ opacity: 0.5 }} />
            <Text size="lg" c="dimmed">
                {hasError ? `Error loading ${type}s` : `No ${type}s found`}
            </Text>
            <Text size="sm" c="dimmed">
                {hasError ? "Try refreshing the page" : "Try adjusting your filters or create a new ticket"}
            </Text>
        </Stack>
    );

    if (isLoading) return <LoadingState />;
    if (!data || data.tickets.length === 0) return <EmptyState hasError={!!error} />;

    return (
        <Stack gap="md">
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
                {data.tickets.map((ticket) => (
                    <TicketCard key={ticket._id} ticket={ticket} />
                ))}
            </SimpleGrid>

            {data.pages > 1 && (
                <Group justify="center" mt="xl">
                    <Pagination value={page} onChange={setPage} total={data.pages} />
                </Group>
            )}
        </Stack>
    );
}
