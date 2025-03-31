import { Stack, Group, Text, Timeline, Card, Button, Title, Collapse } from "@mantine/core";
import { ITournament } from "../../../interfaces/Tournament";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import moment from "moment";
import { useDisclosure } from "@mantine/hooks";
import MarkdownText from "../common/MarkdownText";
import UserLink from "../common/UserLink";
import { IconProp } from "@fortawesome/fontawesome-svg-core";

interface IProps {
    tournament: ITournament;
}

export default function TournamentLogs({ tournament }: IProps) {
    const [opened, { toggle }] = useDisclosure(false);

    if (!tournament.logs?.length) {
        return (
            <Card shadow="sm" p="lg" radius="md">
                <Stack gap="md">
                    <Title order={3}>Logs</Title>
                    <Text c="dimmed" fs="italic" size="sm">
                        No logs available
                    </Text>
                </Stack>
            </Card>
        );
    }

    // Sort logs by createdAt in descending order (newest first)
    const sortedLogs = [...tournament.logs].sort(
        (a, b) => moment(b.createdAt).valueOf() - moment(a.createdAt).valueOf()
    );

    return (
        <Card shadow="sm" p="lg" radius="md">
            <Stack gap="md">
                <Group justify="space-between" align="center">
                    <Title order={3}>Logs</Title>
                    <Button
                        variant="subtle"
                        onClick={toggle}
                        rightSection={<FontAwesomeIcon icon={opened ? "caret-up" : "caret-down"} />}>
                        {opened ? "Hide Logs" : "Show Logs"}
                    </Button>
                </Group>

                <Collapse in={opened}>
                    <Timeline active={sortedLogs.length - 1} bulletSize={24} lineWidth={2}>
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
                                <Text size="xs" c="dimmed">
                                    {moment(log.createdAt).fromNow()}
                                </Text>
                            </Timeline.Item>
                        ))}
                    </Timeline>
                </Collapse>
            </Stack>
        </Card>
    );
}
