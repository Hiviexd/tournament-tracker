import {
    Badge,
    Card,
    Divider,
    Group,
    Pagination,
    ScrollArea,
    SimpleGrid,
    Skeleton,
    Stack,
    Table,
    Tabs,
    Text,
} from "@mantine/core";
import { useEffect, useState } from "react";
import { parseAsString, parseAsInteger, useQueryStates } from "nuqs";
import { useNotificationJobsListing, useNotificationQueueStats } from "../hooks/useDebug";
import { INotificationJobListItem, NOTIFICATION_JOB_STATUSES, NOTIFICATION_PROVIDERS } from "@tc/types/NotificationJob";
import NotificationJobDetailModal from "../components/notification-jobs/NotificationJobDetailModal";
import EmptyState from "../components/common/EmptyState";
import DateBadge from "../components/common/badges/DateBadge";
import NotificationJobsFilters, {
    NotificationJobFiltersValues,
} from "../components/notification-jobs/NotificationJobsFilters";
import { pickStringUnion } from "@tc/utils/client";

function StatCard({ title, value, color = "primary" }: { title: string; value: number; color?: string }) {
    return (
        <Card shadow="sm" p="md">
            <Group justify="space-between" align="center">
                <Text size="sm" c="dimmed">
                    {title}
                </Text>
                <Badge color={color} variant="light">
                    {value}
                </Badge>
            </Group>
        </Card>
    );
}

function StatsLoadingState() {
    return (
        <Stack gap="md">
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
                {Array.from({ length: 8 }).map((_, index) => (
                    <Card shadow="sm" p="md" key={`card-${index}`}>
                        <Skeleton height={16} width="45%" mb="sm" />
                        <Skeleton height={24} width="35%" />
                    </Card>
                ))}
            </SimpleGrid>
        </Stack>
    );
}

function JobsLoadingState() {
    return (
        <Stack gap="md">
            <Skeleton height={14} width={220} />
            <Card shadow="sm" p="md">
                <Stack gap="sm">
                    <Group grow>
                        <Skeleton height={14} />
                        <Skeleton height={14} />
                        <Skeleton height={14} />
                        <Skeleton height={14} />
                        <Skeleton height={14} />
                        <Skeleton height={14} />
                    </Group>
                    {Array.from({ length: 10 }).map((_, index) => (
                        <Group key={`row-${index}`} grow>
                            <Skeleton height={20} />
                            <Skeleton height={20} />
                            <Skeleton height={20} />
                            <Skeleton height={20} />
                            <Skeleton height={20} />
                            <Skeleton height={20} />
                        </Group>
                    ))}
                </Stack>
            </Card>
            <Group justify="center">
                <Skeleton height={30} width={220} />
            </Group>
        </Stack>
    );
}

function HttpStatusBadge({ statusCode }: { statusCode: number | null | undefined }) {
    if (statusCode == null) {
        return (
            <Badge color="gray" variant="light">
                N/A
            </Badge>
        );
    }

    if (statusCode >= 500) {
        return (
            <Badge color="danger" variant="light">
                {statusCode}
            </Badge>
        );
    }

    if (statusCode >= 400) {
        return (
            <Badge color="warning" variant="light">
                {statusCode}
            </Badge>
        );
    }

    if (statusCode >= 300) {
        return (
            <Badge color="yellow" variant="light">
                {statusCode}
            </Badge>
        );
    }

    return (
        <Badge color="success" variant="light">
            {statusCode}
        </Badge>
    );
}

function AttemptsBadge({ attempts, maxAttempts }: { attempts: number; maxAttempts: number }) {
    const ratio = maxAttempts > 0 ? attempts / maxAttempts : 0;
    const color = ratio >= 0.75 ? "danger" : ratio >= 0.4 ? "warning" : "success";

    return (
        <Badge color={color} variant="light">
            {attempts}/{maxAttempts}
        </Badge>
    );
}
export default function NotificationJobsPage() {
    const [selectedJob, setSelectedJob] = useState<INotificationJobListItem | null>(null);

    const [queryState, setQueryState] = useQueryStates(
        {
            tab: parseAsString.withDefault("jobs"),
            page: parseAsInteger.withDefault(1),
            provider: parseAsString.withDefault(""),
            status: parseAsString.withDefault(""),
            kind: parseAsString.withDefault(""),
            payload: parseAsString.withDefault(""),
        },
        { clearOnDefault: true },
    );

    const { data: statsData, isLoading: isStatsLoading, error: statsError } = useNotificationQueueStats();
    const shouldFetchListing = queryState.tab === "jobs";
    const {
        data: listingData,
        isLoading: isListingLoading,
        error: listingError,
    } = useNotificationJobsListing(
        {
            page: queryState.page,
            status: pickStringUnion(queryState.status, NOTIFICATION_JOB_STATUSES),
            provider: pickStringUnion(queryState.provider, NOTIFICATION_PROVIDERS),
            kind: queryState.kind,
            payload: queryState.payload,
        },
        shouldFetchListing,
    );

    const jobs = listingData?.jobs || [];
    const currentPage = listingData?.page || 1;
    const totalPages = listingData?.pages || 1;

    const filters: NotificationJobFiltersValues = {
        kind: queryState.kind,
        payload: queryState.payload,
        provider: pickStringUnion(queryState.provider, NOTIFICATION_PROVIDERS) ?? "",
        status: pickStringUnion(queryState.status, NOTIFICATION_JOB_STATUSES) ?? "",
    };

    const handleFilterChange = (nextFilters: NotificationJobFiltersValues) => {
        const filterChanged =
            nextFilters.kind !== filters.kind ||
            nextFilters.payload !== filters.payload ||
            nextFilters.provider !== filters.provider ||
            nextFilters.status !== filters.status;

        setQueryState({
            kind: nextFilters.kind,
            payload: nextFilters.payload,
            provider: nextFilters.provider,
            status: nextFilters.status,
            page: filterChanged ? 1 : queryState.page,
        });
    };

    const queueTotal =
        (statsData?.queue.pending || 0) +
        (statsData?.queue.processing || 0) +
        (statsData?.queue.sent || 0) +
        (statsData?.queue.failed || 0);

    useEffect(() => {
        if (queryState.tab === "failed") {
            setQueryState({ tab: "jobs", status: "failed", page: 1 });
        }
    }, [queryState.tab, setQueryState]);

    return (
        <Stack gap="md">
            <NotificationJobDetailModal opened={!!selectedJob} job={selectedJob} onClose={() => setSelectedJob(null)} />

            <Tabs value={queryState.tab} onChange={(value) => setQueryState({ tab: value || "jobs", page: 1 })}>
                <Tabs.List>
                    <Tabs.Tab value="jobs">Jobs</Tabs.Tab>
                    <Tabs.Tab value="stats">Stats</Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="jobs" pt="md">
                    <Stack gap="md">
                        <NotificationJobsFilters values={filters} onChange={handleFilterChange} />
                        <Divider />
                        {isListingLoading ? (
                            <JobsLoadingState />
                        ) : listingError ? (
                            <EmptyState
                                icon="triangle-exclamation"
                                title="Failed to load notification jobs"
                                description="Try refreshing the page."
                            />
                        ) : jobs.length === 0 ? (
                            <EmptyState icon="bell" title="No jobs found" description="Try adjusting your filters." />
                        ) : (
                            <Stack gap="md">
                                <Text size="sm" c="dimmed">
                                    Showing {jobs.length} of {listingData?.total || jobs.length} jobs
                                </Text>
                                <Card shadow="sm" p="lg">
                                    <ScrollArea>
                                        <Table miw={900} highlightOnHover>
                                            <Table.Thead>
                                                <Table.Tr>
                                                    <Table.Th>Provider</Table.Th>
                                                    <Table.Th>Kind</Table.Th>
                                                    <Table.Th>Status</Table.Th>
                                                    <Table.Th>Attempts</Table.Th>
                                                    <Table.Th>HTTP</Table.Th>
                                                    <Table.Th>Updated</Table.Th>
                                                </Table.Tr>
                                            </Table.Thead>
                                            <Table.Tbody>
                                                {jobs.map((job) => (
                                                    <Table.Tr
                                                        key={job.id || job._id}
                                                        style={{ cursor: "pointer" }}
                                                        onClick={() => setSelectedJob(job)}>
                                                        <Table.Td>
                                                            <Badge
                                                                color={job.provider === "discord" ? "info" : "pink"}
                                                                variant="light">
                                                                {job.provider}
                                                            </Badge>
                                                        </Table.Td>
                                                        <Table.Td>{job.kind}</Table.Td>
                                                        <Table.Td>
                                                            <Badge
                                                                color={
                                                                    job.status === "failed"
                                                                        ? "danger"
                                                                        : job.status === "sent"
                                                                          ? "success"
                                                                          : job.status === "processing"
                                                                            ? "info"
                                                                            : "yellow"
                                                                }
                                                                variant="light">
                                                                {job.status}
                                                            </Badge>
                                                        </Table.Td>
                                                        <Table.Td>
                                                            <AttemptsBadge
                                                                attempts={job.attempts}
                                                                maxAttempts={job.maxAttempts}
                                                            />
                                                        </Table.Td>
                                                        <Table.Td>
                                                            <HttpStatusBadge statusCode={job.lastHttpStatus} />
                                                        </Table.Td>
                                                        <Table.Td>
                                                            <DateBadge date={new Date(job.updatedAt)} staticColor />
                                                        </Table.Td>
                                                    </Table.Tr>
                                                ))}
                                            </Table.Tbody>
                                        </Table>
                                    </ScrollArea>
                                </Card>
                                {totalPages > 1 && (
                                    <Group justify="center">
                                        <Pagination
                                            value={currentPage}
                                            onChange={(page) => setQueryState({ page })}
                                            total={totalPages}
                                        />
                                    </Group>
                                )}
                            </Stack>
                        )}
                    </Stack>
                </Tabs.Panel>

                <Tabs.Panel value="stats" pt="md">
                    {isStatsLoading ? (
                        <StatsLoadingState />
                    ) : statsError || !statsData ? (
                        <EmptyState
                            icon="triangle-exclamation"
                            title="Failed to load notification stats"
                            description="Try refreshing the page."
                        />
                    ) : (
                        <Stack gap="md">
                            <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
                                <StatCard title="Queue Pending" value={statsData.queue.pending} color="yellow" />
                                <StatCard title="Queue Processing" value={statsData.queue.processing} color="info" />
                                <StatCard title="Queue Failed" value={statsData.queue.failed} color="danger" />
                                <StatCard title="Queue Total" value={queueTotal} color="primary" />
                            </SimpleGrid>
                            <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
                                <StatCard title="Runtime Enqueued" value={statsData.runtime.enqueued} color="primary" />
                                <StatCard title="Runtime Sent" value={statsData.runtime.sent} color="success" />
                                <StatCard title="Runtime Retried" value={statsData.runtime.retried} color="warning" />
                                <StatCard title="Runtime Failed" value={statsData.runtime.failed} color="danger" />
                            </SimpleGrid>
                        </Stack>
                    )}
                </Tabs.Panel>
            </Tabs>
        </Stack>
    );
}
