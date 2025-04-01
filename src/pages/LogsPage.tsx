import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useLogs } from "../hooks/useLogs";
import { LogCategory } from "../../interfaces/Log";
import { useDebouncedValue } from "@mantine/hooks";
import { Stack, Group, Pagination, Card, Skeleton, Text } from "@mantine/core";
import LogsFilters from "../components/logs/LogsFilters";
import LogsTable from "../components/logs/LogsTable";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function LogsPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [page, setPage] = useState(() => Number(searchParams.get("page")) || 1);
    const [searchInput, setSearchInput] = useState({
        user: searchParams.get("user") || "",
        category: (searchParams.get("category") as LogCategory) || "",
        type: searchParams.get("type") || "",
    });
    const [debouncedUser] = useDebouncedValue(searchInput.user, 400);

    useEffect(() => {
        const params = new URLSearchParams();
        if (debouncedUser) params.set("user", debouncedUser);
        if (searchInput.category) params.set("category", searchInput.category);
        if (searchInput.type) params.set("type", searchInput.type);
        if (page > 1) params.set("page", page.toString());
        setSearchParams(params);
    }, [debouncedUser, searchInput.category, searchInput.type, page, setSearchParams]);

    const { data, isLoading, error } = useLogs({
        user: debouncedUser,
        category: searchInput.category,
        type: searchInput.type,
        page,
    });

    const LoadingState = () => (
        <Stack gap="md">
            {
                <Card shadow="sm" p="lg">
                    <Skeleton height={32} width="100%" mb="lg" />
                    {[...Array(10)].map((_, index) => (
                        <Skeleton key={index} height={24} width="100%" mb="xs" />
                    ))}
                </Card>
            }
        </Stack>
    );

    const EmptyState = ({ hasError }: { hasError: boolean }) => {
        return (
            <Stack align="center" justify="center" h={200}>
                <FontAwesomeIcon icon="history" size="2x" style={{ opacity: 0.5 }} />
                <Text size="lg" c="dimmed">
                    {hasError ? "Error loading logs" : "No logs found"}
                </Text>
                <Text size="sm" c="dimmed">
                    {hasError ? `Try refreshing the page` : "Try adjusting your filters"}
                </Text>
            </Stack>
        );
    };

    return (
        <Stack gap="md">
            <LogsFilters values={searchInput} onChange={setSearchInput} />

            {isLoading ? (
                <LoadingState />
            ) : !data || data.logs.length === 0 ? (
                <EmptyState hasError={!!error} />
            ) : (
                <LogsTable logs={data.logs} />
            )}

            {data && data.pages > 1 && (
                <Group justify="center" mt="xs">
                    <Pagination value={page} onChange={setPage} total={data.pages} />
                </Group>
            )}
        </Stack>
    );
}
