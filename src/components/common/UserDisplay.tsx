import { Stack, Group, Avatar } from "@mantine/core";
import { IUser, type UserGroup, type BadgedUserGroup } from "../../../interfaces/User";
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
    let userGroups: BadgedUserGroup[] | null;

    if (user?.groups) {
        userGroups = user.groups.filter((g) => ["tc", "cc", "alm"].includes(g)) as BadgedUserGroup[];
    } else {
        userGroups = null;
    }

    return (
        <Group align="center" gap="sm">
            <Avatar src={avatarUrl ?? user?.avatarUrl} size={40} radius="md" />
            <Stack gap={2}>
                <UserLink user={user} username={username} asText={!!username || asText} c="white" />
                <Group gap="0.5rem">
                    {group && <UserGroupBadge group={group} />}
                    {userGroups?.map((g) => (
                        <UserGroupBadge key={g} group={g} />
                    ))}
                </Group>
            </Stack>
        </Group>
    );
}
