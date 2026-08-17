import { Group, Switch, Text, Loader } from "@mantine/core";
import { useAtom } from "jotai";
import { loggedInUserAtom } from "../../../store/atoms";
import { useUpdateNewsSubscription } from "../../../hooks/useUsers";

export default function NewsSubscriptionSetting() {
    const [user] = useAtom(loggedInUserAtom);
    const updateNewsSubscription = useUpdateNewsSubscription();

    if (!user) return null;

    return (
        <Group justify="space-between">
            <div>
                <Text size="sm" fw={500}>
                    osu! news notifications
                </Text>
                <Text size="xs" c="dimmed">
                    Receive an osu! chat announcement when a news post is published
                </Text>
                {updateNewsSubscription.error && (
                    <Text size="xs" c="red">
                        {updateNewsSubscription.error.toString()}
                    </Text>
                )}
            </div>
            <Group gap="xs">
                {updateNewsSubscription.isPending && <Loader size="xs" />}
                <Switch
                    checked={Boolean(user.isSubscribedToNews)}
                    onChange={(event) => updateNewsSubscription.mutate(event.currentTarget.checked)}
                    disabled={updateNewsSubscription.isPending}
                />
            </Group>
        </Group>
    );
}
