import { Stack, Group, Avatar } from "@mantine/core";
import { IUser, type UserGroup, type BadgedUserGroup, BADGED_USER_GROUPS } from "@tc/types/User";
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
    onClick?: () => void;
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
    onClick,
}: IPropTypes) {
    let userGroups: BadgedUserGroup[] | null;

    if (user?.groups) {
        userGroups = user.groups.filter((g): g is BadgedUserGroup => BADGED_USER_GROUPS.some((group) => group === g));
    } else {
        userGroups = null;
    }

    const handleClick = (e: React.MouseEvent) => {
        if (onClick) {
            e.stopPropagation();
            onClick();
        }
    };

    return (
        <Group align="center" gap="sm">
            <Avatar
                src={avatarUrl ?? user?.avatarUrl}
                size={40}
                radius="md"
                onClick={handleClick}
                style={{ cursor: onClick ? "pointer" : "default" }}
            />
            <Stack gap={2}>
                <UserLink
                    user={user}
                    username={username}
                    asText={!!username || asText}
                    c="white"
                    disablePopover={disablePopover}
                    onClick={onClick ? () => onClick() : undefined}
                />
                <Group gap="0.5rem" align="center">
                    {showCountryFlag && user?.country && <CountryFlag country={user.country} />}
                    {group && BADGED_USER_GROUPS.some((g) => g === group) && (
                        <UserGroupBadge group={group} tooltip={tooltips} />
                    )}
                    {userGroups?.map((g) => (
                        <UserGroupBadge key={g} group={g} tooltip={tooltips} />
                    ))}
                </Group>
            </Stack>
        </Group>
    );
}
