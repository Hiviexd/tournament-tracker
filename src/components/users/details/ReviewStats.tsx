import { List, Stack, Title, Text, Skeleton, Table, NumberInput, Group, Badge, Divider, Tooltip } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import dayjs from "dayjs";
import { useReviewStats } from "../../../hooks/useUsers";
import { IUser } from "../../../../interfaces/User";
import AlertText from "../../common/AlertText";

interface IProps {
    user: IUser;
}

/** Parse timespan string (e.g. "Same day", "5 days") to number of days, or null if none. */
function parseTimespanDays(timespan: string | null | undefined): number | null {
    if (timespan == null || timespan === "—") return null;
    if (timespan === "Same day") return 0;
    const m = timespan.match(/^(\d+)\s*day/);
    return m ? parseInt(m[1], 10) : null;
}

/** Badge color for timespan: green ≤7, yellow 8–12, red >12. */
function timespanBadgeColor(days: number): "success" | "warning" | "danger" | "blue" {
    if (days === 0) return "blue";
    if (days <= 7) return "success";
    if (days <= 12) return "warning";
    return "danger";
}

function ReviewStatsLoadingState() {
    return (
        <Stack gap="xs" w="50%">
            <Skeleton height={20} radius="md" />
            <Skeleton height={20} radius="md" />
            <Skeleton height={20} radius="md" />
        </Stack>
    );
}

export default function ReviewStats({ user }: IProps) {
    const [days, setDays] = useState(180);
    const { data: stats, isLoading } = useReviewStats(user.id, days);

    if (!user.isCommittee) return null;

    return (
        <Stack gap="md">
            <Divider />
            <Title order={4}>Review Statistics</Title>

            <Group align="flex-end" gap="sm">
                <NumberInput
                    label="Days"
                    value={days}
                    onChange={(v) => setDays(typeof v === "string" ? parseInt(v, 10) || 180 : (v ?? 180))}
                    min={1}
                    max={365}
                    w={100}
                />
            </Group>

            {isLoading ? (
                <ReviewStatsLoadingState />
            ) : stats ? (
                <Stack gap="md">
                    <List>
                        <List.Item>
                            <Text size="sm" c="dimmed">
                                Active Reviews:{" "}
                                <Text span fw={500}>
                                    {stats.activeReviews}
                                </Text>
                            </Text>
                        </List.Item>
                        <List.Item>
                            <Text size="sm" c="dimmed">
                                Assigned ({days}d):{" "}
                                <Text span fw={500}>
                                    {stats.totalAssignedLastNDays}
                                </Text>
                            </Text>
                        </List.Item>
                        <List.Item>
                            <Text size="sm" c="dimmed">
                                Submitted ({days}d):{" "}
                                <Text span fw={500}>
                                    {stats.totalSubmittedLastNDays}
                                </Text>
                            </Text>
                        </List.Item>
                    </List>

                    {stats.assignments && stats.assignments.length > 0 ? (
                        <Table>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>Review</Table.Th>
                                    <Table.Th ta="center">Action</Table.Th>
                                    <Table.Th ta="center">Reviewed</Table.Th>
                                    <Table.Th ta="center">Timespan</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {stats.assignments.map((row: any, index: number) => (
                                    <Table.Tr key={`${row.tournament.id}-${row.dateAssigned}-${index}`}>
                                        {/* Tournament name */}
                                        <Table.Td>
                                            <Text
                                                fw={700}
                                                component="a"
                                                href={`/tournaments/${row.tournament.id}`}
                                                size="sm"
                                                style={{ color: "var(--mantine-color-anchor)" }}
                                                target="_blank"
                                                rel="noopener noreferrer">
                                                {row.tournament.name}
                                            </Text>
                                        </Table.Td>
                                        {/* Action date */}
                                        <Table.Td ta="center">
                                            <Group justify="center" gap="xs" wrap="nowrap">
                                                <Tooltip label={row.actionIcon === "add" ? "Assigned" : "Removed"}>
                                                    <FontAwesomeIcon
                                                        icon={row.actionIcon === "add" ? "user-plus" : "user-minus"}
                                                        size="sm"
                                                        style={{
                                                            color:
                                                                row.actionIcon === "add"
                                                                    ? "var(--mantine-color-success-6)"
                                                                    : "var(--mantine-color-red-6)",
                                                        }}
                                                    />
                                                </Tooltip>
                                                <Text size="sm">
                                                    {row.dateAssigned ? dayjs(row.dateAssigned).format("DD MMM") : "—"}
                                                </Text>
                                            </Group>
                                        </Table.Td>
                                        {/* Reviewed date */}
                                        <Table.Td ta="center">
                                            <Text size="sm">
                                                {row.dateReviewed ? dayjs(row.dateReviewed).format("DD MMM") : "—"}
                                            </Text>
                                        </Table.Td>
                                        {/* Timespan */}
                                        <Table.Td ta="center">
                                            {(() => {
                                                const days = parseTimespanDays(row.timespan);
                                                if (days === null) {
                                                    return <Text size="sm">—</Text>;
                                                }
                                                return (
                                                    <Badge color={timespanBadgeColor(days)} size="sm" variant="light">
                                                        {row.timespan}
                                                    </Badge>
                                                );
                                            })()}
                                        </Table.Td>
                                    </Table.Tr>
                                ))}
                            </Table.Tbody>
                        </Table>
                    ) : (
                        <AlertText type="warning">
                            No assignments in the last {days} days.
                        </AlertText>
                    )}
                </Stack>
            ) : (
                <AlertText type="danger">
                    Failed to load review statistics!
                </AlertText>
            )}
        </Stack>
    );
}
