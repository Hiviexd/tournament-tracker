import { Group, Avatar, Text } from "@mantine/core";

interface IProps {
    username: string;
    avatarUrl: string;
}

export default function UserOption({ username, avatarUrl }: IProps) {
    return (
        <Group wrap="nowrap">
            <Avatar src={avatarUrl} size={24} radius="xl" />
            <Text size="sm">{username}</Text>
        </Group>
    );
}
