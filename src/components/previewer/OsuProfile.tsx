import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart, faTimes } from "@fortawesome/free-solid-svg-icons";
import { Box, Tooltip, Stack, Text } from "@mantine/core";
import dayjs from "../../../utils/dayjs";
import { LocalBadge } from "../../hooks/useBadgePreviewer";
import CountryFlag from "../common/CountryFlag";
import { IOsuUser } from "../../../interfaces/OsuApi";
import OsuUserGroupBadge from "./OsuUserGroupBadge";
import utils from "../../../utils";

interface LocalUser extends IOsuUser {
    badges?: LocalBadge[];
}

interface OsuProfileProps {
    user: LocalUser;
    onDeleteBadge?: (badge: LocalBadge) => void;
}

export default function OsuProfile({ user, onDeleteBadge }: OsuProfileProps) {
    const renderSupporterHearts = () => {
        return Array.from({ length: user.support_level || 0 }).map((_, index) => (
            <FontAwesomeIcon key={`supporter-${index}`} icon={faHeart} />
        ));
    };

    // Sort badges by awarded date (newest first)
    const sortedBadges = user.badges
        ? user.badges.toSorted(
              (a, b) => dayjs(b.awarded_at).valueOf() - dayjs(a.awarded_at).valueOf(),
          )
        : [];

    return (
        <div className="osu-profile">
            {/* Banner Section */}
            <div className="profile-banner">
                <img src={user.cover.url} alt="Profile Banner" />
            </div>

            {/* User Info Section */}
            <div className="profile-info">
                <div className="profile-avatar">
                    <img src={user.avatar_url} alt={user.username} />
                </div>
                <div className="profile-details">
                    <div className="username-container">
                        <a className="username" href={`https://osu.ppy.sh/users/${user.id}`} target="_blank" rel="noopener noreferrer">
                            {user.username}
                        </a>
                        <div className="user-badges">
                            {!!user.support_level && (
                                <Tooltip
                                    label="osu!supporter"
                                    arrowSize={10}
                                    styles={{
                                        tooltip: {
                                            textAlign: "center",
                                            border: "none",
                                            backgroundColor: "hsl(333, 10%, 10%)",
                                        },
                                        arrow: {
                                            border: "none",
                                        },
                                    }}>
                                    <div className="supporter-badge">{renderSupporterHearts()}</div>
                                </Tooltip>
                            )}
                            {user.groups && user.groups.map((group) => <OsuUserGroupBadge key={group.id} group={group} />)}
                        </div>
                    </div>
                    {user.title && (
                        <div className="user-title" style={{ color: utils.sanitizeCssColor(user.profile_colour) ?? undefined }}>
                            {user.title}
                        </div>
                    )}
                    <Box mt="5">
                        <CountryFlag country={user.country} showCountryName />
                    </Box>
                </div>
            </div>

            {/* Badges Section */}
            <div className="profile-badges">
                {sortedBadges.map((badge) => (
                    <Tooltip
                        label={
                            <Stack gap={2}>
                                <Text size="sm">{badge.description}</Text>
                                <Text size="xs" c="#dcaec3">
                                    {dayjs(badge.awarded_at).format("D MMMM YYYY")}
                                </Text>
                            </Stack>
                        }
                        key={badge.localId}
                        multiline
                        miw={100}
                        maw={300}
                        arrowSize={10}
                        styles={{
                            tooltip: {
                                textAlign: "center",
                                border: "none",
                                backgroundColor: "hsl(333, 10%, 10%)",
                            },
                            arrow: {
                                border: "none",
                            },
                        }}>
                        <div className="badge-item">
                            <img src={badge["image@2x_url"]} alt={badge.description} title={badge.description} />
                            {onDeleteBadge && (
                                <button
                                    type="button"
                                    className="badge-delete-overlay"
                                    aria-label="Remove badge"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteBadge(badge);
                                    }}>
                                    <FontAwesomeIcon icon={faTimes} />
                                </button>
                            )}
                        </div>
                    </Tooltip>
                ))}
            </div>
        </div>
    );
}
