import { Card, Group, Tooltip, Badge, Loader } from "@mantine/core";
import { IUser } from "../../../interfaces/User";
import UserDisplay from "./UserDisplay";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useImageLoad } from "../../hooks/useImageLoad";

interface IProps {
    user: IUser;
    onSelect: (user: IUser) => void;
    static?: boolean;
    showBadges?: boolean;
    fullWidth?: boolean;
}

export default function UserCard({
    user,
    onSelect,
    static: isStatic = false,
    showBadges = false,
    fullWidth = false,
}: IProps) {
    const { loading, error } = useImageLoad(user.coverUrl);

    // Use fallback image if there's an error or no cover URL
    const backgroundImageUrl = error || !user.coverUrl ? "/assets/default-banner.jpg" : user.coverUrl;

    return (
        <Card
            key={user._id}
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
                    backgroundImage: `url(${backgroundImageUrl})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    filter: "brightness(0.4)",
                    opacity: loading ? 0 : 1,
                    zIndex: 0,
                }}
            />

            {/* Loading spinner */}
            {loading && (
                <div
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        zIndex: 2,
                    }}>
                    <Loader size="sm" color="primary" />
                </div>
            )}
            <div className="user-card-tint" />
            <div className="user-card-content" style={{ opacity: loading ? 0 : 1 }}>
                <Group gap="xs" justify="space-between">
                    <UserDisplay user={user} tooltips="top" disablePopover showCountryFlag />

                    {/* warning badges */}
                    {user.isCommittee && showBadges && (
                        <Group gap={2} flex={1} justify="flex-end">
                            {!user.email && (
                                <Tooltip label="No email">
                                    <Badge variant="filled" color="primary.11" size="sm">
                                        <FontAwesomeIcon icon="envelope" color="var(--mantine-color-danger-6)" />
                                    </Badge>
                                </Tooltip>
                            )}
                            {(!user.discordId || !user.discordId.length) && (
                                <Tooltip label="No Discord ID">
                                    <Badge variant="filled" color="primary.11" size="sm">
                                        <FontAwesomeIcon icon="id-card" color="var(--mantine-color-danger-6)" />
                                    </Badge>
                                </Tooltip>
                            )}
                            {!user.isActiveReviewer && (
                                <Tooltip label="Inactive Reviewer">
                                    <Badge variant="filled" color="primary.11" size="sm">
                                        <FontAwesomeIcon
                                            icon="magnifying-glass"
                                            color="var(--mantine-color-danger-6)"
                                        />
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
