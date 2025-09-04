import { Anchor, AnchorProps, Text, HoverCard } from "@mantine/core";
import { IUser } from "../../../interfaces/User";
import UserCard from "./UserCard";

interface IPropTypes extends Omit<AnchorProps, "href"> {
    user?: IUser;
    username?: string;
    asText?: boolean;
    disablePopover?: boolean;
}

export default function UserLink({ user, username, asText, disablePopover = false, ...props }: IPropTypes) {
    const handleLinkClick = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    if (asText) {
        return (
            <Text component="span" fw={props.fw ?? 700} c={props.c ?? "white"} {...props}>
                {username ?? user?.username}
            </Text>
        );
    }

    return (
        <HoverCard position="right" shadow="md" disabled={!user || disablePopover}>
            <HoverCard.Target>
                <Anchor
                    {...props}
                    fw={props.fw ?? 700}
                    onClick={handleLinkClick}
                    href={`https://osu.ppy.sh/users/${user?.osuId}`}
                    target="_blank">
                    {user?.username ?? "Unknown"}
                </Anchor>
            </HoverCard.Target>
            <HoverCard.Dropdown p={0} style={{ border: "none" }}>
                {user && <UserCard user={user} static />}
            </HoverCard.Dropdown>
        </HoverCard>
    );
}
