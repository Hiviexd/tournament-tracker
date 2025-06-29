import { Stack, Text, Card, Group, Badge, Tooltip } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IVoting } from "../../../../interfaces/Voting";
import UserLink from "../../common/UserLink";
import DateBadge from "../../common/badges/DateBadge";

interface IProps {
    votings: IVoting[];
}

export default function TournamentVotings({ votings }: IProps) {
    return (
        <Stack gap={5}>
            <Group gap="xs" align="center">
                <Text size="sm" fw={500}>
                    Votes
                </Text>
                <Tooltip label="Only shows votes matching the tournament's forum URL">
                    <FontAwesomeIcon icon="exclamation-circle" size="sm" style={{ opacity: 0.6 }} />
                </Tooltip>
                <Badge color={votings.length > 0 ? "blue" : "gray"} variant="light" size="sm">
                    {votings.length}
                </Badge>
            </Group>

            <Stack gap="xs">
                {votings.length === 0 && (
                    <Text size="sm" c="dimmed" fs="italic">
                        No votes found
                    </Text>
                )}
                {votings.map((voting) => (
                    <Card
                        key={voting._id}
                        p="sm"
                        radius="sm"
                        component="a"
                        href={`/votes/${voting._id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="tournament-voting-card">
                        <Group justify="space-between" align="flex-start" gap="xs">
                            <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                                <Text size="sm" fw={500} lineClamp={1}>
                                    {voting.title}
                                </Text>
                                <Text size="xs" c="dimmed">
                                    by <UserLink user={voting.author} />
                                </Text>
                            </Stack>
                            <Group gap={4} align="center">
                                <Badge
                                    color={voting.isActive ? "info" : "gray"}
                                    variant="light"
                                    size="xs"
                                    leftSection={<FontAwesomeIcon icon="vote-yea" size="xs" />}>
                                    {voting.isActive ? "Active" : "Concluded"}
                                </Badge>
                                <DateBadge
                                    date={voting.isActive ? voting.deadline : voting.concludedAt || voting.updatedAt}
                                    warningAge={1}
                                    dangerAge={0}
                                    staticColor={!voting.isActive}
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
