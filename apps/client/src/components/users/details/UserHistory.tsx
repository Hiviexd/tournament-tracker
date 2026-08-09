import { Timeline, Text, Stack, Title } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IUserHistory } from "@tc/types/User";
import dayjs from "@tc/utils/dayjs";

interface IProps {
    history: IUserHistory[];
}

export default function UserHistory({ history }: IProps) {
    return (
        <Stack gap="xs">
            <Title order={4}>History</Title>
            {!history.length && (
                <Text c="dimmed" size="sm" fs="italic">
                    No history available...
                </Text>
            )}
            <Timeline active={history.length} bulletSize={24}>
                {history
                    .toSorted((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf())
                    .map((entry) => (
                        <Timeline.Item
                            key={`${entry.date}-${entry.kind}-${entry.group}`}
                            color={entry.kind === "join" ? (entry.group === "tc" ? "warning" : "info") : "gray.7"}
                            bullet={
                                <FontAwesomeIcon icon={entry.kind === "join" ? "user-plus" : "user-minus"} size="xs" />
                            }>
                            <Text size="sm" fw={500}>
                                {entry.kind === "join" ? "Joined" : "Left"} {entry.group.toUpperCase()}
                            </Text>
                            <Text size="xs" c="dimmed">
                                {dayjs(entry.date).format("LL")}
                            </Text>
                        </Timeline.Item>
                    ))}
            </Timeline>
        </Stack>
    );
}
