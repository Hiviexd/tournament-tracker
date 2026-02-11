import { Card, Group, Tooltip, Badge } from "@mantine/core";
import { IUser } from "../../../interfaces/User";
import UserDisplay from "./UserDisplay";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface IProps {
    user: IUser;
    onSelect?: (user: IUser) => void;
    static?: boolean;
    showBadges?: boolean;
    fullWidth?: boolean;
}

export default function UserCard({
    user,
    onSelect = () => {},
    static: isStatic = false,
    showBadges = false,
    fullWidth = false,
}: IProps) {
    const backgroundImageUrl = user.coverUrl
        ? `url(${user.coverUrl}), url(/assets/default-banner.jpg)`
        : `url(/assets/default-banner.jpg)`;

    return (
        <Card
            key={user.id}
            shadow="sm"
            p="md"
            bg="primary.10"
            className={`user-card ${isStatic ? "user-card-static" : ""} ${fullWidth ? "user-card-full-width" : ""}`}
            style={{ minWidth: 240, cursor: isStatic ? "default" : "pointer" }}
            onClick={() => onSelect(user)}>
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundImage: backgroundImageUrl,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    filter: "brightness(0.4)",
                    zIndex: 0,
                }}
            />

            <div className="user-card-tint" />
            <div className="user-card-content">
                <Group gap="xs" justify="space-between">
                    <UserDisplay user={user} tooltips="top" disablePopover showCountryFlag />

                    {/* warning badges */}
                    {user.isCommittee && showBadges && (
                        <Group gap={2} flex={1} justify="flex-end">
                            {!user.email && (
                                <Tooltip label="No Email">
                                    <Badge variant="light" color="danger" size="sm">
                                        <FontAwesomeIcon icon="envelope" />
                                    </Badge>
                                </Tooltip>
                            )}
                            {(!user.discordId || !user.discordId.length) && (
                                <Tooltip label="No Discord ID">
                                    <Badge variant="light" color="danger" size="sm">
                                        <FontAwesomeIcon icon="id-card" />
                                    </Badge>
                                </Tooltip>
                            )}
                            {!user.isActiveReviewer && (
                                <Tooltip label="Inactive Reviewer">
                                    <Badge variant="light" color="danger" size="sm">
                                        <FontAwesomeIcon icon="magnifying-glass" />
                                    </Badge>
                                </Tooltip>
                            )}
                        </Group>
                    )}
                </Group>
            </div>
        </Card>
    );
}
