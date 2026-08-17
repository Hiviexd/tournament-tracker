import { Stack, Group, Text, Title, Button } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useAtom } from "jotai";
import { IUser } from "@tc/types/User";
import { useSyncUser } from "../../../hooks/useUsers";
import { loggedInUserAtom } from "../../../store/atoms";
import utils from "@tc/utils/client";

interface IProps {
    user: IUser;
}

export default function UserStatus({ user }: IProps) {
    const [loggedInUser] = useAtom(loggedInUserAtom);
    const syncUserMutation = useSyncUser(user.id || "");
    const objectId = user.id || String(user._id);

    const handleSync = async () => {
        try {
            await syncUserMutation.mutateAsync();
        } catch (error) {
            console.error("Failed to sync user: " + error);
        }
    };

    return (
        <Stack gap="xs">
            <Title order={4}>Status</Title>

            <Button
                variant="light"
                size="xs"
                leftSection={<FontAwesomeIcon icon="sync" />}
                onClick={handleSync}
                loading={syncUserMutation.isPending}>
                Sync osu! data
            </Button>

            {utils.hasRequiredPermissions(loggedInUser, ["admin"]) && (
                <Group gap="xs">
                    <FontAwesomeIcon icon="code" color="var(--mantine-color-info-6)" />
                    <Text size="sm">ID: {objectId}</Text>
                </Group>
            )}

            <Group gap="xs">
                <FontAwesomeIcon
                    icon="magnifying-glass"
                    color={user.isActiveReviewer ? "var(--mantine-color-success-6)" : "var(--mantine-color-danger-6)"}
                />
                <Text size="sm">Active Reviewer: {user.isActiveReviewer ? "Yes" : "No"}</Text>
            </Group>
            <Group gap="xs">
                <FontAwesomeIcon
                    icon="vote-yea"
                    color={user.isActiveVoter ? "var(--mantine-color-success-6)" : "var(--mantine-color-danger-6)"}
                />
                <Text size="sm">Active Voter: {user.isActiveVoter ? "Yes" : "No"}</Text>
            </Group>
            <Group gap="xs">
                <FontAwesomeIcon
                    icon="user-shield"
                    color={user.isAdmin ? "var(--mantine-color-success-6)" : "var(--mantine-color-danger-6)"}
                />
                <Text size="sm">Administrator: {user.isAdmin ? "Yes" : "No"}</Text>
            </Group>
            <Group gap="xs">
                <FontAwesomeIcon
                    icon="id-card"
                    color={user.discordId ? "var(--mantine-color-success-6)" : "var(--mantine-color-danger-6)"}
                />
                <Text size="sm">Discord ID: {user.discordId ?? "Not set!"}</Text>
            </Group>
            <Group gap="xs">
                <FontAwesomeIcon
                    icon="envelope"
                    color={user.email ? "var(--mantine-color-success-6)" : "var(--mantine-color-danger-6)"}
                />
                <Text size="sm">Email: {user.email ?? "Not set!"}</Text>
            </Group>
        </Stack>
    );
}
