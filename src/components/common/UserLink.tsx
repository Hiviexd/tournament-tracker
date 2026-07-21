import { Anchor, AnchorProps, Text, HoverCard } from "@mantine/core";
import { IUser } from "../../../interfaces/User";
import UserCard from "./UserCard";
import BanIconBadge from "./badges/BanIconBadge";

interface IPropTypes extends Omit<AnchorProps, "href" | "onClick"> {
    user?: IUser;
    username?: string;
    asText?: boolean;
    disablePopover?: boolean;
    displayActiveInfringement?: boolean;
    onClick?: () => void;
}

export default function UserLink({
    user,
    username,
    asText,
    disablePopover = false,
    displayActiveInfringement = false,
    onClick,
    ...props
}: IPropTypes) {
    const handleLinkClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onClick) {
            e.preventDefault(); // Prevent navigation when onClick is provided
            onClick();
        }
    };

    const banBadge =
        displayActiveInfringement && user?.activeInfringement ? (
            <BanIconBadge infringement={user.activeInfringement} osuId={user.osuId} />
        ) : null;

    if (asText) {
        return (
            <Text
                component="span"
                fw={props.fw ?? 700}
                c={props.c ?? "white"}
                onClick={onClick ? handleLinkClick : undefined}
                style={{ cursor: onClick ? "pointer" : "default" }}
                {...props}>
                {username ?? user?.username}
                {banBadge}
            </Text>
        );
    }

    return (
        <HoverCard position="right" shadow="md" disabled={!user || disablePopover}>
            <HoverCard.Target>
                <Text component="span" style={{ display: "inline-flex", alignItems: "center" }}>
                    <Anchor
                        {...props}
                        fw={props.fw ?? 700}
                        onClick={handleLinkClick}
                        href={onClick ? undefined : `https://osu.ppy.sh/users/${user?.osuId}`}
                        target={onClick ? undefined : "_blank"}
                        rel={onClick ? undefined : "noopener noreferrer"}
                        style={{ cursor: "pointer" }}>
                        {user?.username ?? "Unknown"}
                    </Anchor>
                    {banBadge}
                </Text>
            </HoverCard.Target>
            <HoverCard.Dropdown p={0} style={{ border: "none" }}>
                {user && <UserCard user={user} static />}
            </HoverCard.Dropdown>
        </HoverCard>
    );
}
