import { Group, Switch, Text, Loader } from "@mantine/core";
import { useAtom } from "jotai";
import { loggedInUserAtom } from "../../../store/atoms";
import { useToggleVoterStatus } from "../../../hooks/useUsers";

export default function VoterStatusSetting() {
    const [user] = useAtom(loggedInUserAtom);
    const toggleVoterMutation = useToggleVoterStatus(user?.id || "");

    if (!user?.isCommittee) return null;

    return (
        <Group justify="space-between">
            <div>
                <Text size="sm" fw={500}>
                    Voting Activity
                </Text>
                <Text size="xs" c="dimmed">
                    Toggle your availability for vote participation and reminders
                </Text>
                {toggleVoterMutation.error && (
                    <Text size="xs" c="red">
                        {toggleVoterMutation.error.toString()}
                    </Text>
                )}
            </div>
            <Group gap="xs">
                {toggleVoterMutation.isPending && <Loader size="xs" />}
                <Switch
                    checked={user.isActiveVoter}
                    onChange={() => toggleVoterMutation.mutate()}
                    disabled={toggleVoterMutation.isPending}
                />
            </Group>
        </Group>
    );
}
