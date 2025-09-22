import { Group, Switch, Text, Loader } from "@mantine/core";
import { useAtom } from "jotai";
import { loggedInUserAtom } from "../../../store/atoms";
import { useToggleReviewerStatus } from "../../../hooks/useUsers";

export default function ReviewerStatusSetting() {
    const [user] = useAtom(loggedInUserAtom);
    const toggleReviewerMutation = useToggleReviewerStatus(user?.id || "");

    if (!user?.isCommittee) return null;

    return (
        <Group justify="space-between">
            <div>
                <Text size="sm" fw={500}>
                    Activity Status
                </Text>
                <Text size="xs" c="dimmed">
                    Toggle your availability for votes and tournament reviews
                </Text>
                {toggleReviewerMutation.error && (
                    <Text size="xs" c="red">
                        {toggleReviewerMutation.error.toString()}
                    </Text>
                )}
            </div>
            <Group gap="xs">
                {toggleReviewerMutation.isPending && <Loader size="xs" />}
                <Switch
                    checked={user.isActiveReviewer}
                    onChange={() => toggleReviewerMutation.mutate()}
                    disabled={toggleReviewerMutation.isPending}
                />
            </Group>
        </Group>
    );
}
