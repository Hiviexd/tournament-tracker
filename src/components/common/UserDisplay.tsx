import { Stack, Group, Avatar } from "@mantine/core";
import { IUser } from "../../../interfaces/User";
import UserGroupBadge from "./badges/UserGroupBadge";
import UserLink from "./UserLink";

interface IPropTypes {
    user: IUser;
    asText?: boolean;
}

export default function UserDisplay({ user, asText }: IPropTypes) {

    return (
        <Group align="center" gap="sm">
            <Avatar src={user.avatarUrl} size={40} radius="md" />
            <Stack gap={2}>
                <UserLink user={user} asText={asText} c="white" />
                <UserGroupBadge user={user} />
            </Stack>
        </Group>
    );
}
