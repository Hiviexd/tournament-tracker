import { Stack, Group, Avatar } from "@mantine/core";
import { IUser, UserGroup } from "../../../interfaces/User";
import UserGroupBadge from "./badges/UserGroupBadge";
import UserLink from "./UserLink";

interface IPropTypes {
    user?: IUser;
    username?: string;
    avatarUrl?: string;
    group?: UserGroup;
    asText?: boolean;
}

export default function UserDisplay({ user, username, avatarUrl, group, asText }: IPropTypes) {
    return (
        <Group align="center" gap="sm">
            <Avatar src={avatarUrl ?? user?.avatarUrl} size={40} radius="md" />
            <Stack gap={2}>
                <UserLink user={user} username={username} asText={!!username || asText} c="white" />
                <UserGroupBadge user={user} group={group} />
            </Stack>
        </Group>
    );
}
