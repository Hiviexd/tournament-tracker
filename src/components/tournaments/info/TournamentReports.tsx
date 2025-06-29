import { Stack, Text, Card, Group, Badge, Tooltip } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ITicket } from "../../../../interfaces/Ticket";
import UserLink from "../../common/UserLink";
import DateBadge from "../../common/badges/DateBadge";

interface IProps {
    reports: ITicket[];
}

export default function TournamentReports({ reports }: IProps) {
    return (
        <Stack gap={5}>
            <Group gap="xs" align="center">
                <Text size="sm" fw={500}>
                    Reports
                </Text>
                <Tooltip label="Only shows reports matching the tournament's forum URL">
                    <FontAwesomeIcon icon="exclamation-circle" size="sm" style={{ opacity: 0.6 }} />
                </Tooltip>
                <Badge color={reports.length > 0 ? "red" : "gray"} variant="light" size="sm">
                    {reports.length}
                </Badge>
            </Group>

            <Stack gap="xs">
                {reports.length === 0 && (
                    <Text size="sm" c="dimmed" fs="italic">
                        No reports found
                    </Text>
                )}
                {reports.map((report) => (
                    <Card
                        key={report._id}
                        p="sm"
                        radius="sm"
                        component="a"
                        href={`/reports/${report._id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="tournament-report-card">
                        <Group justify="space-between" align="flex-start" gap="xs">
                            <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                                <Text size="sm" fw={500} lineClamp={1}>
                                    {report.title}
                                </Text>
                                <Text size="xs" c="dimmed">
                                    by <UserLink user={report.author} />
                                </Text>
                            </Stack>
                            <Group gap={4} align="center">
                                <Badge
                                    color={report.isActive ? "warning" : "gray"}
                                    variant="light"
                                    size="xs"
                                    leftSection={<FontAwesomeIcon icon="flag" size="xs" />}>
                                    {report.isActive ? "Open" : "Closed"}
                                </Badge>
                                <DateBadge
                                    date={report.lastResponseAt}
                                    warningAge={7}
                                    dangerAge={10}
                                    staticColor={!report.isActive}
                                    size="xs"
                                />
                            </Group>
                        </Group>
                    </Card>
                ))}
            </Stack>
        </Stack>
    );
}
