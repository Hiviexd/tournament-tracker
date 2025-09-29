import { Stack, Text, Card, Group, Badge, Tooltip } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IVoting } from "../../../interfaces/Voting";
import UserLink from "./UserLink";
import DateBadge from "./badges/DateBadge";
import { TruncatedText } from "./TruncatedText";

interface IProps {
    votings: IVoting[];
    hideTooltip?: boolean;
}

export default function VotingsMiniSection({ votings, hideTooltip = false }: IProps) {
    if (!votings) return null;

    return (
        <Stack gap={5}>
            <Group gap="xs" align="center">
                <Text size="sm" fw={500} className="header-border-left">
                    Votes
                </Text>
                {!hideTooltip && (
                    <Tooltip multiline w={232} label="Only shows votes matching the tournament's name or forum URL">
                        <FontAwesomeIcon icon="exclamation-circle" size="sm" style={{ opacity: 0.6 }} />
                    </Tooltip>
                )}
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
                        key={voting.id}
                        p="sm"
                        radius="sm"
                        component="a"
                        href={`/votes/${voting._id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="tournament-voting-card">
                        <Group justify="space-between" align="flex-start" gap="xs">
                            <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                                <TruncatedText lineClamp={1} textProps={{ size: "sm", fw: 500 }}>
                                    {voting.title}
                                </TruncatedText>
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
