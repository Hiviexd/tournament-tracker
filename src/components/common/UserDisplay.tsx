import { Stack, Group, Avatar, Loader } from "@mantine/core";
import { IUser, type UserGroup, type BadgedUserGroup } from "../../../interfaces/User";
import UserGroupBadge from "./badges/UserGroupBadge";
import UserLink from "./UserLink";
import { useImageLoad } from "../../hooks/useImageLoad";
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
    const avatarSrc = avatarUrl ?? user?.avatarUrl;
    const { loading, error } = useImageLoad(avatarSrc);

    let userGroups: BadgedUserGroup[] | null;

    if (user?.groups) {
        userGroups = user.groups.filter((g) => ["tc", "cc", "alm"].includes(g)) as BadgedUserGroup[];
    } else {
        userGroups = null;
    }

    return (
        <Group align="center" gap="sm">
            <div style={{ position: "relative", display: "inline-block" }}>
                <Avatar
                    src={error ? undefined : avatarSrc}
                    size={40}
                    radius="md"
                    style={{ opacity: loading ? 0 : 1 }}
                />
                {loading && (
                    <div
                        style={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                        }}>
                        <Loader size="xs" color="primary" />
                    </div>
                )}
            </div>
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
