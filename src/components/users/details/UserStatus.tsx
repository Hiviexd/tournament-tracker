import { Stack, Group, Text, Title, Button } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IUser } from "../../../../interfaces/User";
import { useSyncUser } from "../../../hooks/useUsers";

interface IProps {
    user: IUser;
}

export default function UserStatus({ user }: IProps) {
    const syncUserMutation = useSyncUser(user._id || "");

    const handleSync = async () => {
        try {
            await syncUserMutation.mutateAsync(user._id);
        } catch (error) {
            console.error("Failed to sync user: " + error);
        }
    }

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

            <Group gap="xs">
                <FontAwesomeIcon
                    icon="magnifying-glass"
                    color={user.isActiveReviewer ? "var(--mantine-color-success-6)" : "var(--mantine-color-danger-6)"}
                />
                <Text size="sm">Active Reviewer: {user.isActiveReviewer ? "Yes" : "No"}</Text>
            </Group>

            <Group gap="xs">
                <FontAwesomeIcon
                    icon="user-shield"
                    color={user.isAdmin ? "var(--mantine-color-success-6)" : "var(--mantine-color-danger-6)"}
                />
                <Text size="sm">Administrator: {user.isAdmin ? "Yes" : "No"}</Text>
            </Group>
        </Stack>
    );
}
