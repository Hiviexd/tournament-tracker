import { Anchor, AnchorProps, Text } from "@mantine/core";
import { IUser } from "../../../interfaces/User";

interface IPropTypes extends Omit<AnchorProps, "href"> {
    user: IUser;
    asText?: boolean;
}

export default function UserLink({ user, asText, ...props }: IPropTypes) {
    const handleLinkClick = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    if (asText) {
        return (
            <Text component="span" fw={props.fw ?? 700} c={props.c ?? "white"} {...props}>
                {user.username}
            </Text>
        );
    }

    return (
        <Anchor
            {...props}
            fw={props.fw ?? 700}
            onClick={handleLinkClick}
            href={`https://osu.ppy.sh/users/${user.osuId}`}
            target="_blank">
            {user.username}
        </Anchor>
    );
}
