import { Stack, Group, Avatar } from "@mantine/core";
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
                <a href={`https://osu.ppy.sh/users/${user.osuId}`} target="_blank">
                    {user.username}
                </a>
                <UserGroupBadge user={user} />
            </Stack>
        </Group>
    );
}
