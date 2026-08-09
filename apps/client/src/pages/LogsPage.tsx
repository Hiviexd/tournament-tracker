import { Stack, Group, Pagination, Card, Skeleton, Text } from "@mantine/core";
import { useLogs } from "../hooks/useLogs";
import { LogCategory } from "@tc/types/Log";
import { useQueryStates, parseAsString, parseAsInteger } from "nuqs";
import LogsFilters from "../components/logs/LogsFilters";
import LogsTable from "../components/logs/LogsTable";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

function LogsLoadingState() {
    return (
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
}

function LogsEmptyState({ hasError }: { hasError: boolean }) {
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
}

interface FilterValues {
    user: string;
    category: LogCategory;
    type: string;
    content: string;
}

export default function LogsPage() {
    // Define query state parsers with default values
    const [queryState, setQueryState] = useQueryStates(
        {
            user: parseAsString.withDefault(""),
            category: parseAsString.withDefault(""),
            type: parseAsString.withDefault(""),
            page: parseAsInteger.withDefault(1),
            content: parseAsString.withDefault(""),
        },
        {
            // Only include non-default values in URL
            clearOnDefault: true,
        },
    );

    // Create filters object for LogsFilters component
    const filters: FilterValues = {
        user: queryState.user,
        category: queryState.category as LogCategory,
        type: queryState.type,
        content: queryState.content,
    };

    const handleFilterChange = (newFilters: FilterValues) => {
        // Check if any filter has changed to reset page
        const filterChanged =
            newFilters.user !== filters.user ||
            newFilters.category !== filters.category ||
            newFilters.type !== filters.type ||
            newFilters.content !== filters.content;

        setQueryState({
            user: newFilters.user,
            category: newFilters.category,
            type: newFilters.type,
            page: filterChanged ? 1 : queryState.page,
            content: newFilters.content,
        });
    };

    // Handle page changes
    const handlePageChange = (newPage: number) => {
        setQueryState({ page: newPage });
    };

    const { data, isLoading, error } = useLogs({
        // TODO: fix typing in user param
        // @ts-expect-error - if it works, it works.
        user: queryState.user,
        category: queryState.category as LogCategory,
        type: queryState.type,
        page: queryState.page,
        content: queryState.content,
    });

    return (
        <Stack gap="md">
            <LogsFilters values={filters} onChange={handleFilterChange} />

            {isLoading ? (
                <LogsLoadingState />
            ) : !data || data.logs.length === 0 ? (
                <LogsEmptyState hasError={!!error} />
            ) : (
                <LogsTable logs={data.logs} />
            )}

            {data && data.pages > 1 && (
                <Group justify="center" mt="xs">
                    <Pagination value={queryState.page} onChange={handlePageChange} total={data.pages} />
                </Group>
            )}
        </Stack>
    );
}
