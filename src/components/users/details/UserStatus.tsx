import { Stack, Group, Text, Title } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IUser } from "../../../../interfaces/User";

interface IProps {
    user: IUser;
}

export default function UserStatus({ user }: IProps) {
    return (
        <Stack gap="xs">
            <Title order={4}>Status</Title>

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
