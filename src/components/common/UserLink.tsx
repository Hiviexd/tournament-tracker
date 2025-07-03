import { Anchor, AnchorProps, Text, Popover } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IUser } from "../../../interfaces/User";
import UserCard from "./UserCard";

interface IPropTypes extends Omit<AnchorProps, "href"> {
    user?: IUser;
    username?: string;
    asText?: boolean;
    disablePopover?: boolean;
}

export default function UserLink({ user, username, asText, disablePopover = false, ...props }: IPropTypes) {
    const [opened, { close, open }] = useDisclosure(false);

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
        <Popover position="right" shadow="md" disabled={!user || disablePopover} opened={opened}>
            <Popover.Target>
                <Anchor
                    {...props}
                    fw={props.fw ?? 700}
                    onClick={handleLinkClick}
                    href={`https://osu.ppy.sh/users/${user?.osuId}`}
                    target="_blank"
                    onMouseEnter={open}
                    onMouseLeave={close}>
                    {user?.username ?? "Unknown"}
                </Anchor>
            </Popover.Target>
            <Popover.Dropdown p={0} style={{ border: "none" }}>
                {user && <UserCard user={user} onSelect={() => {}} static />}
            </Popover.Dropdown>
        </Popover>
    );
}
