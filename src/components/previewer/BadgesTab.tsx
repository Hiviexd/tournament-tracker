import { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart, faTimes } from "@fortawesome/free-solid-svg-icons";
import {
    TextInput,
    Button,
    Group,
    Card,
    Divider,
    Stack,
    Paper,
    Center,
    Text,
    Modal,
    Textarea,
    Tooltip,
    Loader,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useDropzone } from "react-dropzone";
import moment from "moment";
import { useSearchParams } from "react-router-dom";
import { IOsuUser, IOsuBadge } from "../../../interfaces/OsuApi";
import { useOsuUserInfo } from "../../hooks/useUsers";
import defaultBanner from "/assets/default-banner.jpg";
import * as countryFlags from "country-flag-icons/react/3x2";

// Extend IOsuBadge to include a local ID for tracking
interface LocalBadge extends IOsuBadge {
    localId?: string;
    dimensions?: { width: number; height: number };
}

interface LocalUser extends IOsuUser {
    badges?: LocalBadge[];
}

const DEFAULT_USER: LocalUser = {
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
            image_url: "https://assets.ppy.sh/profile-badges/NAT2y.png",
            "image@2x_url": "https://assets.ppy.sh/profile-badges/NAT2y@2x.png",
        },
    ],
};

export default function BadgesTab() {
    const [searchParams] = useSearchParams();
    const [user, setUser] = useState<LocalUser>(DEFAULT_USER);
    const [userInput, setUserInput] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const { data: osuUser, isLoading } = useOsuUserInfo(searchQuery);
    const [isAddingBadge, setIsAddingBadge] = useState(false);
    const [newBadge, setNewBadge] = useState<Partial<LocalBadge>>({
        description: "",
        awarded_at: new Date(),
    });
    const [localUrls, setLocalUrls] = useState<Map<string, string>>(new Map());
    const [imageLoading, setImageLoading] = useState(false);

    // Function to check image dimensions
    const checkImageDimensions = useCallback((file: File): Promise<{ width: number; height: number }> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const objectUrl = URL.createObjectURL(file);

            img.onload = () => {
                const dimensions = { width: img.width, height: img.height };
                URL.revokeObjectURL(objectUrl);
                resolve(dimensions);
            };

            img.onerror = () => {
                URL.revokeObjectURL(objectUrl);
                reject(new Error("Failed to load image"));
            };

            img.src = objectUrl;
        });
    }, []);

    // Function to validate image dimensions
    const isValidBadgeDimension = useCallback((width: number, height: number): boolean => {
        return (width === 86 && height === 40) || (width === 172 && height === 80);
    }, []);

    // Handle file drop for badge
    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            if (acceptedFiles.length > 0) {
                const file = acceptedFiles[0];
                if (file.type.startsWith("image/")) {
                    setImageLoading(true);

                    checkImageDimensions(file)
                        .then((dimensions) => {
                            if (isValidBadgeDimension(dimensions.width, dimensions.height)) {
                                const url = URL.createObjectURL(file);
                                const localId = `badge_${Math.random().toString(36).substring(7)}`;
                                setLocalUrls((prev) => new Map(prev).set(localId, url));
                                setNewBadge((prev) => ({
                                    ...prev,
                                    "image@2x_url": url,
                                    image_url: url,
                                    localId,
                                    dimensions,
                                }));
                                setIsAddingBadge(true);
                            } else {
                                notifications.show({
                                    title: "Invalid badge dimensions",
                                    message: `Badge must be 86x40 or 172x80 pixels. Detected: ${dimensions.width}x${dimensions.height}`,
                                    color: "red",
                                });
                            }
                        })
                        .catch((error) => {
                            notifications.show({
                                title: "Error processing image",
                                message: error.message,
                                color: "red",
                            });
                        })
                        .finally(() => {
                            setImageLoading(false);
                        });
                } else {
                    notifications.show({
                        title: "Invalid file type",
                        message: "Please upload an image file",
                        color: "red",
                    });
                }
            }
        },
        [checkImageDimensions, isValidBadgeDimension]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
        },
        maxFiles: 1,
        disabled: imageLoading,
    });

    // Handle paste for badge
    useEffect(() => {
        const handlePaste = (e: ClipboardEvent) => {
            // Only process paste events when badges tab is active
            const currentTab = searchParams.get("tab") || "badges";
            if (currentTab !== "badges") return;

            const items = e.clipboardData?.items;
            if (!items) return;

            for (const item of Array.from(items)) {
                if (item.type.startsWith("image/")) {
                    const file = item.getAsFile();
                    if (file) {
                        setImageLoading(true);

                        checkImageDimensions(file)
                            .then((dimensions) => {
                                if (isValidBadgeDimension(dimensions.width, dimensions.height)) {
                                    const url = URL.createObjectURL(file);
                                    const localId = `badge_${Math.random().toString(36).substring(7)}`;
                                    setLocalUrls((prev) => new Map(prev).set(localId, url));
                                    setNewBadge((prev) => ({
                                        ...prev,
                                        "image@2x_url": url,
                                        image_url: url,
                                        localId,
                                        dimensions,
                                    }));
                                    setIsAddingBadge(true);
                                } else {
                                    notifications.show({
                                        title: "Invalid badge dimensions",
                                        message: `Badge must be 86x40 or 172x80 pixels. Detected: ${dimensions.width}x${dimensions.height}`,
                                        color: "red",
                                    });
                                }
                            })
                            .catch((error) => {
                                notifications.show({
                                    title: "Error processing image",
                                    message: error.message,
                                    color: "red",
                                });
                            })
                            .finally(() => {
                                setImageLoading(false);
                            });
                        break;
                    }
                }
            }
        };

        window.addEventListener("paste", handlePaste);
        return () => window.removeEventListener("paste", handlePaste);
    }, [searchParams, checkImageDimensions, isValidBadgeDimension]);

    // Clean up object URLs when component unmounts
    useEffect(() => {
        return () => {
            localUrls.forEach((url) => {
                URL.revokeObjectURL(url);
            });
        };
    }, []);

    const handleLoadUser = () => {
        const trimmedInput = userInput.trim();
        if (trimmedInput) {
            setSearchQuery(trimmedInput);
        }
    };

    const handleAddBadge = () => {
        if (!newBadge.description || !newBadge["image@2x_url"]) {
            notifications.show({
                title: "Missing information",
                message: "Please provide both an image and description for the badge",
                color: "red",
            });
            return;
        }

        setUser((prev) => ({
            ...prev,
            badges: [...(prev.badges || []), newBadge as LocalBadge],
        }));

        // Reset form without revoking URL
        setNewBadge({
            description: "",
            awarded_at: new Date(),
        });
        setIsAddingBadge(false);
    };

    // Update user when API data is received
    useEffect(() => {
        if (osuUser) {
            // Clean up any local URLs before setting new user
            localUrls.forEach((url) => {
                URL.revokeObjectURL(url);
            });
            setLocalUrls(new Map());
            setUser(osuUser);
            setUserInput("");
            setSearchQuery("");
        }
    }, [osuUser]);

    const handleDeleteBadge = useCallback((badgeToDelete: LocalBadge) => {
        // If it's a local badge with a local URL, revoke it
        if (
            badgeToDelete.localId &&
            badgeToDelete["image@2x_url"] &&
            !badgeToDelete["image@2x_url"].startsWith("https://")
        ) {
            URL.revokeObjectURL(badgeToDelete["image@2x_url"]);
            setLocalUrls((prev) => {
                const newUrls = new Map(prev);
                newUrls.delete(badgeToDelete.localId!);
                return newUrls;
            });
        }

        // Remove the badge from user's badges
        setUser((prev) => ({
            ...prev,
            badges: prev.badges?.filter((badge) => badge !== badgeToDelete) || [],
        }));
    }, []);

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
                <Group grow align="flex-end">
                    <div>
                        <TextInput
                            label="Load osu! profile"
                            placeholder="Enter username or osu! ID"
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleLoadUser()}
                        />
                        <Button
                            mt="sm"
                            onClick={handleLoadUser}
                            loading={isLoading}
                            disabled={!userInput.trim()}
                            fullWidth>
                            Load User
                        </Button>
                    </div>

                    <Paper
                        {...getRootProps()}
                        h={105}
                        className="dropzone"
                        style={{
                            border: `2px dashed var(--mantine-color-${isDragActive ? "primary" : "gray"}-4)`,
                            backgroundColor: isDragActive
                                ? "var(--mantine-color-primary-light)"
                                : "var(--mantine-color-body)",
                            cursor: imageLoading ? "default" : "pointer",
                            transition: "all 0.2s ease",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            opacity: imageLoading ? 0.7 : 1,
                        }}>
                        <input {...getInputProps()} />
                        {imageLoading ? (
                            <Center>
                                <Loader size="sm" />
                                <Text size="sm" ml="xs">
                                    Checking image dimensions...
                                </Text>
                            </Center>
                        ) : (
                            <>
                                <Center>
                                    <Text size="sm" c={isDragActive ? "primary" : "dimmed"}>
                                        {isDragActive
                                            ? "Drop the badge here..."
                                            : "Drag a badge here, or click to select one"}
                                    </Text>
                                </Center>
                                <Center mt={5}>
                                    <Text size="xs" c="dimmed">
                                        You can also paste (CTRL+V) an image
                                    </Text>
                                </Center>
                                <Center mt={5}>
                                    <Text size="xs" c="dimmed">
                                        Badge must be 86x40 or 172x80 pixels
                                    </Text>
                                </Center>
                            </>
                        )}
                    </Paper>
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
                            {!!user.support_level && <div className="supporter-badge">{renderSupporterHearts()}</div>}
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
                            <Tooltip
                                label={
                                    <Stack gap={2}>
                                        <Text size="sm">{badge.description}</Text>
                                        <Text size="xs" c="#dcaec3">
                                            {moment(badge.awarded_at).format("D MMMM YYYY")}
                                        </Text>
                                    </Stack>
                                }
                                key={index}
                                multiline
                                miw={100}
                                maw={300}
                                styles={{
                                    tooltip: {
                                        textAlign: "center",
                                        border: "none",
                                    },
                                    arrow: {
                                        border: "none",
                                    },
                                }}>
                                <div className="badge-item">
                                    <img
                                        src={badge["image@2x_url"]}
                                        alt={badge.description}
                                        title={badge.description}
                                    />
                                    <div
                                        className="badge-delete-overlay"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteBadge(badge);
                                        }}>
                                        <FontAwesomeIcon icon={faTimes} />
                                    </div>
                                </div>
                            </Tooltip>
                        ))}
                </div>
            </div>

            {/* Badge Add Modal */}
            <Modal
                opened={isAddingBadge}
                onClose={() => {
                    setIsAddingBadge(false);
                    setNewBadge({
                        description: "",
                        awarded_at: new Date(),
                    });
                }}
                title="Add New Badge">
                <Stack>
                    {newBadge["image@2x_url"] && (
                        <Stack align="center">
                            <div className="badge-item" style={{ margin: "0 auto" }}>
                                <img src={newBadge["image@2x_url"]} alt="New badge preview" />
                            </div>
                            {newBadge.dimensions && (
                                <Text size="xs" c="dimmed" ta="center" mt={5}>
                                    Resolution: {newBadge.dimensions.width}x{newBadge.dimensions.height} pixels
                                </Text>
                            )}
                        </Stack>
                    )}
                    <Textarea
                        label="Badge Description"
                        placeholder="Enter badge description"
                        value={newBadge.description}
                        onChange={(e) => setNewBadge((prev) => ({ ...prev, description: e.target.value }))}
                        autosize
                        minRows={2}
                    />
                    <TextInput
                        label="Award Date"
                        type="date"
                        value={
                            newBadge.awarded_at instanceof Date ? newBadge.awarded_at.toISOString().split("T")[0] : ""
                        }
                        onChange={(e) => setNewBadge((prev) => ({ ...prev, awarded_at: new Date(e.target.value) }))}
                    />
                    <Button onClick={handleAddBadge} disabled={!newBadge.description || !newBadge["image@2x_url"]}>
                        Add Badge
                    </Button>
                </Stack>
            </Modal>
        </Stack>
    );
}
