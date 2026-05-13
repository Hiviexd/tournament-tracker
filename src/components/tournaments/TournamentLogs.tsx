import { Stack, Group, Text, Timeline, Card, Title, Collapse, Tooltip, SegmentedControl, Box } from "@mantine/core";
import { ITournament, ITournamentReviewHistoryEntry, ReviewHistoryAction } from "../../../interfaces/Tournament";
import { IUser } from "../../../interfaces/User";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import dayjs from "../../../utils/dayjs";
import { useDisclosure } from "@mantine/hooks";
import { useState } from "react";
import MarkdownText from "../common/MarkdownText";
import UserLink from "../common/UserLink";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import ExpandButton from "../common/buttons/ExpandButton";

interface IProps {
    tournament: ITournament;
}

const REVIEW_ACTION_CONFIG: Record<
    ReviewHistoryAction,
    { label: string; color: "primary" | "green" | "red" }
> = {
    initial: { label: "Assigned", color: "primary" },
    assign: { label: "Added", color: "green" },
    remove: { label: "Removed", color: "red" },
};

export default function TournamentLogs({ tournament }: IProps) {
    const [opened, { toggle }] = useDisclosure(false);
    const [segment, setSegment] = useState<"all" | "review">("all");

    const hasLogs = tournament.logs?.length && tournament.logs.length > 0;
    const hasReviewHistory = tournament.reviewHistory?.length && tournament.reviewHistory.length > 0;

    if (!hasLogs && !hasReviewHistory) {
        return (
            <Card shadow="sm" p="lg" radius="md">
                <Stack gap="md">
                    <Title order={3}>Logs</Title>
                    <Text c="dimmed" fs="italic" size="sm">
                        No logs available...
                    </Text>
                </Stack>
            </Card>
        );
    }

    const sortedLogs = hasLogs
        ? [...tournament.logs!].sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf())
        : [];
    const sortedReviewHistory = hasReviewHistory
        ? [...(tournament.reviewHistory as ITournamentReviewHistoryEntry[])].sort(
              (a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf(),
          )
        : [];

    const showAll = segment === "all";
    const showReview = segment === "review";
    const countAll = sortedLogs.length;
    const countReview = sortedReviewHistory.length;

    return (
        <Card shadow="sm" p="lg" radius="md">
            <Stack gap="md">
                <Group justify="space-between" align="center">
                    <Group gap="7" align="baseline">
                        <Title order={3}>Logs</Title>
                        <Title order={4} c="dimmed">
                            ({showAll ? countAll : countReview})
                        </Title>
                    </Group>

                    <ExpandButton variant="subtle" expanded={opened} onClick={toggle}>
                        {opened ? "Hide Logs" : "Show Logs"}
                    </ExpandButton>
                </Group>

                {(hasLogs || hasReviewHistory) && (
                    <Collapse in={opened}>
                        <Group justify="space-between" align="flex-start" wrap="nowrap" gap="md">
                            <Box style={{ flex: 1, minWidth: 0 }}>
                                {showAll &&
                                    (countAll > 0 ? (
                                        <Timeline active={countAll - 1} bulletSize={24} lineWidth={2}>
                                            {sortedLogs.map((log, index) => (
                                                <Timeline.Item
                                                    key={index}
                                                    bullet={<FontAwesomeIcon icon={log.icon as IconProp} size="sm" />}
                                                    title={
                                                        <Group gap="5">
                                                            <Text size="sm" lineClamp={2}>
                                                                <MarkdownText content={log.action} />
                                                            </Text>
                                                            <Text size="xs" c="dimmed">
                                                                by <UserLink user={log.user} />
                                                            </Text>
                                                        </Group>
                                                    }>
                                                    <Tooltip
                                                        label={dayjs(log.createdAt).format("LLL")}
                                                        position="right">
                                                        <Text size="xs" c="dimmed" w="fit-content">
                                                            {dayjs(log.createdAt).fromNow()}
                                                        </Text>
                                                    </Tooltip>
                                                </Timeline.Item>
                                            ))}
                                        </Timeline>
                                    ) : (
                                        <Text size="sm" c="dimmed" fs="italic">
                                            No general logs.
                                        </Text>
                                    ))}

                                {showReview &&
                                    (countReview > 0 ? (
                                        <Timeline active={countReview - 1} bulletSize={24} lineWidth={2}>
                                            {sortedReviewHistory.map((entry, index) => (
                                                <Timeline.Item
                                                    key={index}
                                                    bullet={
                                                        <FontAwesomeIcon
                                                            icon={
                                                                entry.action === "remove" ? "user-minus" : "user-plus"
                                                            }
                                                            size="xs"
                                                        />
                                                    }
                                                    color={REVIEW_ACTION_CONFIG[entry.action].color}
                                                    title={
                                                        <Group gap="5">
                                                            <Text size="sm">{REVIEW_ACTION_CONFIG[entry.action].label}</Text>
                                                            {entry.user &&
                                                            typeof entry.user === "object" &&
                                                            "username" in entry.user ? (
                                                                <UserLink size="sm" user={entry.user as unknown as IUser} />
                                                            ) : (
                                                                <Text size="xs" c="dimmed">
                                                                    Reviewer
                                                                </Text>
                                                            )}
                                                        </Group>
                                                    }>
                                                    <Tooltip
                                                        label={dayjs(entry.createdAt).format("LLL")}
                                                        position="right">
                                                        <Text size="xs" c="dimmed" w="fit-content">
                                                            {dayjs(entry.createdAt).fromNow()}
                                                        </Text>
                                                    </Tooltip>
                                                </Timeline.Item>
                                            ))}
                                        </Timeline>
                                    ) : (
                                        <Text size="sm" c="dimmed" fs="italic">
                                            No review logs.
                                        </Text>
                                    ))}
                            </Box>
                            <SegmentedControl
                                value={segment}
                                color="primary"
                                onChange={(v) => setSegment(v as "all" | "review")}
                                data={[
                                    { label: "All logs", value: "all" },
                                    { label: "Review logs", value: "review" },
                                ]}
                                style={{ width: "fit-content", flexShrink: 0 }}
                            />
                        </Group>
                    </Collapse>
                )}
            </Stack>
        </Card>
    );
}
