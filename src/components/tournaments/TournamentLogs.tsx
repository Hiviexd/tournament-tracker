import { Stack, Group, Text, Timeline, Card, Title, Collapse, Tooltip } from "@mantine/core";
import { ITournament } from "../../../interfaces/Tournament";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import moment from "moment";
import { useDisclosure } from "@mantine/hooks";
import MarkdownText from "../common/MarkdownText";
import UserLink from "../common/UserLink";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import ExpandButton from "../common/buttons/ExpandButton";

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
                        No logs available...
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
                    <Group gap="7" align="baseline">
                        <Title order={3}>Logs</Title>
                        <Title order={4} c="dimmed">
                            ({tournament.logs.length})
                        </Title>
                    </Group>

                    <ExpandButton variant="subtle" expanded={opened} onClick={toggle}>
                        {opened ? "Hide Logs" : "Show Logs"}
                    </ExpandButton>
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
                                <Tooltip label={moment(log.createdAt).format("LLL")} position="right">
                                    <Text size="xs" c="dimmed" w="fit-content">
                                        {moment(log.createdAt).fromNow()}
                                    </Text>
                                </Tooltip>
                            </Timeline.Item>
                        ))}
                    </Timeline>
                </Collapse>
            </Stack>
        </Card>
    );
}
