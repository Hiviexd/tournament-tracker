import { Timeline, Text, Stack, Title } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IUserHistory } from "../../../../interfaces/User";
import moment from "moment";

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
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .map((entry, index) => (
                        <Timeline.Item
                            key={index}
                            color={entry.kind === "join" ? (entry.group === "tc" ? "warning" : "info") : "gray.7"}
                            bullet={
                                <FontAwesomeIcon icon={entry.kind === "join" ? "user-plus" : "user-minus"} size="xs" />
                            }>
                            <Text size="sm" fw={500}>
                                {entry.kind === "join" ? "Joined" : "Left"} {entry.group.toUpperCase()}
                            </Text>
                            <Text size="xs" c="dimmed">
                                {moment(entry.date).format("LLL")}
                            </Text>
                        </Timeline.Item>
                    ))}
            </Timeline>
        </Stack>
    );
}
