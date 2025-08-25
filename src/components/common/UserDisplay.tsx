import { Stack, Group, Avatar } from "@mantine/core";
import { IUser, type UserGroup, type BadgedUserGroup } from "../../../interfaces/User";
import UserGroupBadge from "./badges/UserGroupBadge";
import UserLink from "./UserLink";
import CountryFlag from "./CountryFlag";

interface IPropTypes {
    user?: IUser;
    username?: string;
    avatarUrl?: string;
    group?: UserGroup;
    tooltips?: "top" | "right" | "bottom" | "left";
    asText?: boolean;
    disablePopover?: boolean;
    showCountryFlag?: boolean;
}

export default function UserDisplay({
    user,
    username,
    avatarUrl,
    group,
    asText,
    tooltips,
    disablePopover = false,
    showCountryFlag = false,
}: IPropTypes) {
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
                <UserLink
                    user={user}
                    username={username}
                    asText={!!username || asText}
                    c="white"
                    disablePopover={disablePopover}
                />
                <Group gap="0.5rem" align="center">
                    {showCountryFlag && user?.country && <CountryFlag country={user.country} />}
                    {group && <UserGroupBadge group={group as BadgedUserGroup} tooltip={tooltips} />}
                    {userGroups?.map((g) => (
                        <UserGroupBadge key={g} group={g} tooltip={tooltips} />
                    ))}
                </Group>
            </Stack>
        </Group>
    );
}
