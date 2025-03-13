import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart } from "@fortawesome/free-solid-svg-icons";
import { TextInput, Button, Group, Card, Divider, Stack } from "@mantine/core";
import { IOsuUser } from "../../../interfaces/OsuApi";
import { useOsuUserInfo } from "../../hooks/useUsers";
import defaultBanner from "/assets/default-banner.jpg";
import * as countryFlags from "country-flag-icons/react/3x2";

const DEFAULT_USER: IOsuUser = {
    id: 7562902,
    username: "Hivie",
    country: {
        code: "TN",
        name: "Tunisia",
    },
    cover: {
        custom_url: defaultBanner,
        url: defaultBanner,
        id: 1,
    },
    avatar_url: "https://a.ppy.sh/14102976",
    profile_colour: "#fa3703",
    title: "osu!taiko Paragon",
    support_level: 2,
    badges: [
        {
            awarded_at: new Date("2024-03-01"),
            description: "Longstanding contribution to the Contest Committee - 1 Year",
            image_url: "https://assets.ppy.sh/profile-badges/tcomm-1y.png",
            "image@2x_url": "https://assets.ppy.sh/profile-badges/tcomm-1y@2x.png",
        },
        {
            awarded_at: new Date("2024-02-01"),
            description: "Longstanding contribution to the Nomination Assessment Team - 2 Years",
            image_url: "https://assets.ppy.sh/profile-badges/tcomm-2y.png",
            "image@2x_url": "https://assets.ppy.sh/profile-badges/tcomm-2y@2x.png",
        },
    ],
};

export default function BadgesTab() {
    const [user, setUser] = useState<IOsuUser>(DEFAULT_USER);
    const [userInput, setUserInput] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const { data: osuUser, isLoading } = useOsuUserInfo(searchQuery);

    const handleLoadUser = () => {
        const trimmedInput = userInput.trim();
        if (trimmedInput) {
            setSearchQuery(trimmedInput);
        }
    };

    // Update user when API data is received
    useEffect(() => {
        if (osuUser) {
            setUser(osuUser);
            setUserInput("");
            setSearchQuery("");
        }
    }, [osuUser]);

    const renderSupporterHearts = () => {
        return Array.from({ length: user.support_level || 0 }).map((_, index) => (
            <FontAwesomeIcon key={index} icon={faHeart} />
        ));
    };

    const CountryFlag = countryFlags[user.country.code as keyof typeof countryFlags];

    return (
        <Stack mt="xl">
            {/* Search Section */}
            <Card withBorder>
                <Group align="flex-end">
                    <TextInput
                        label="osu! Username or ID"
                        placeholder="Enter username or ID"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        style={{ flex: 1 }}
                        onKeyDown={(e) => e.key === "Enter" && handleLoadUser()}
                    />
                    <Button onClick={handleLoadUser} loading={isLoading} disabled={!userInput.trim()}>
                        Load User
                    </Button>
                </Group>
            </Card>

            <Divider />

            <div className="osu-profile">
                {/* Banner Section */}
                <div className="profile-banner">
                    <img src={user.cover.custom_url} alt="Profile Banner" />
                </div>

                {/* User Info Section */}
                <div className="profile-info">
                    <div className="profile-avatar">
                        <img src={user.avatar_url} alt={user.username} />
                    </div>
                    <div className="profile-details">
                        <div className="username-container">
                            <h1 className="username">{user.username}</h1>
                            {user.support_level && <div className="supporter-badge">{renderSupporterHearts()}</div>}
                        </div>
                        {user.title && (
                            <div className="user-title" style={{ color: user.profile_colour }}>
                                {user.title}
                            </div>
                        )}
                        <div className="user-country">
                            <span className="country-flag">
                                <CountryFlag />
                            </span>
                            <span className="country-name">{user.country.name}</span>
                        </div>
                    </div>
                </div>

                {/* Badges Section */}
                <div className="profile-badges">
                    {user.badges
                        ?.sort((a, b) => new Date(b.awarded_at).getTime() - new Date(a.awarded_at).getTime())
                        .map((badge, index) => (
                            <div key={index} className="badge-item">
                                <img src={badge["image@2x_url"]} alt={badge.description} title={badge.description} />
                            </div>
                        ))}
                </div>
            </div>
        </Stack>
    );
}
