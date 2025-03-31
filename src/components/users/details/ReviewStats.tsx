import { List, Stack, Title, Text, Skeleton } from "@mantine/core";
import { useReviewStats } from "../../../hooks/useUsers";
import { IUser } from "../../../../interfaces/User";

interface IProps {
    user: IUser;
}

export default function ReviewStats({ user }: IProps) {
    const { data: stats, isLoading } = useReviewStats(user._id);

    if (!user.isCommittee) return null;

    const LoadingState = () => (
        <Stack gap="xs" w="50%">
            <Skeleton height={20} radius="md" />
            <Skeleton height={20} radius="md" />
            <Skeleton height={20} radius="md" />
        </Stack>
    );

    return (
        <Stack gap="xs">
            <Title order={4}>Review Statistics</Title>

            {isLoading ? (
                <LoadingState />
            ) : stats ? (
                <List>
                    <List.Item>
                        <Text size="sm" c="dimmed">
                            Active Reviews: <Text span>{stats.activeReviews}</Text>
                        </Text>
                    </List.Item>
                    <List.Item>
                        <Text size="sm" c="dimmed">
                            Assigned Reviews (90d): <Text span>{stats.totalAssignedLast90Days}</Text>
                        </Text>
                    </List.Item>
                    <List.Item>
                        <Text size="sm" c="dimmed">
                            Submitted Reviews (90d): <Text span>{stats.totalSubmittedLast90Days}</Text>
                        </Text>
                    </List.Item>
                </List>
            ) : (
                <Text c="dimmed" fs="italic">
                    Failed to load review statistics...
                </Text>
            )}
        </Stack>
    );
}
