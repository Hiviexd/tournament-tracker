import { Stack, Group, Avatar, Text } from "@mantine/core";
import { IUser } from "../../../interfaces/User";
import UserGroupBadge from "./badges/UserGroupBadge";

interface IPropTypes {
    user: IUser;
}

export default function UserDisplay({ user }: IPropTypes) {
    return (
        <Group align="center" gap="sm">
            <Avatar src={user.avatarUrl} size={40} radius="md" />
            <Stack gap={2}>
                <Text
                    fw={700}
                    component="a"
                    href={`https://osu.ppy.sh/users/${user.osuId}`}
                    target="_blank">
                    {user.username}
                </Text>
                <UserGroupBadge user={user} />
            </Stack>
        </Group>
    );
}
