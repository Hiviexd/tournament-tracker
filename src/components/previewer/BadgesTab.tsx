import { useState, useEffect, useCallback } from "react";
import { TextInput, Button, Group, Card, Stack, Paper, Center, Text, Modal, Textarea, Loader } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useDropzone } from "react-dropzone";
import { useSearchParams } from "react-router-dom";
import { IOsuUser } from "../../../interfaces/OsuApi";
import { useOsuUserInfo } from "../../hooks/useUsers";
import { useBadgePreviewer, LocalBadge } from "../../hooks/useBadgePreviewer";
import defaultBanner from "/assets/default-bg-stable.jpg";
import { useAtom } from "jotai";
import { loggedInUserAtom } from "../../store/atoms";
import SignInBanner from "../common/SignInBanner";
import OsuProfile from "./OsuProfile";

interface LocalUser extends IOsuUser {
    badges?: LocalBadge[];
}

interface IProps {
    skeleton: React.ReactNode;
}

export default function BadgesTab({ skeleton }: IProps) {
    const [searchParams] = useSearchParams();
    const [userInput, setUserInput] = useState("");
    const [loggedInUser] = useAtom(loggedInUserAtom);
    const [searchQuery, setSearchQuery] = useState(loggedInUser?.osuId.toString() || "");
    const { data: osuUser, isLoading } = useOsuUserInfo(searchQuery);

    const DEFAULT_USER: LocalUser = {
        id: 3,
        username: "BanchoBot",
        country: {
            code: "SH",
            name: "Saint Helena",
        },
        cover: {
            custom_url: defaultBanner,
            url: defaultBanner,
            id: 1,
        },
        avatar_url: "https://a.ppy.sh/3",
        profile_colour: "#E45678",
        title: "Grilled Dodongo",
        support_level: 3,
        groups: [
            {
                has_listing: false,
                has_playmodes: false,
                id: 29,
                identifier: "bot",
                is_probationary: false,
                name: "Chat Bots",
                short_name: "BOT",
            },
        ],
        badges: [
            {
                awarded_at: new Date("2024-12-01"),
                description: "osu! World Cup 2024 Winner",
                image_url: "https://assets.ppy.sh/profile-badges/owc2024-winner.png",
                "image@2x_url": "https://assets.ppy.sh/profile-badges/owc2024-winner@2x.png",
                localId: "default-1",
            },
            {
                awarded_at: new Date("2023-12-01"),
                description: "osu! World Cup 2023 Winner",
                image_url: "https://assets.ppy.sh/profile-badges/owc2023-winner.png",
                "image@2x_url": "https://assets.ppy.sh/profile-badges/owc2023-winner@2x.png",
                localId: "default-2",
            },
            {
                awarded_at: new Date("2022-12-01"),
                description: "osu! World Cup 2022 Winner",
                image_url: "https://assets.ppy.sh/profile-badges/owc2022-winner.png",
                "image@2x_url": "https://assets.ppy.sh/profile-badges/owc2022-winner@2x.png",
                localId: "default-3",
            },
            {
                awarded_at: new Date("2021-12-01"),
                description: "osu! World Cup 2021 Winner",
                image_url: "https://assets.ppy.sh/profile-badges/badge_owc2021_winner.png",
                "image@2x_url": "https://assets.ppy.sh/profile-badges/badge_owc2021_winner@2x.png",
                localId: "default-4",
            },
            {
                awarded_at: new Date("2020-12-01"),
                description: "osu! World Cup 2020 Winner",
                image_url: "https://assets.ppy.sh/profile-badges/badge_owc2020_winner.png",
                "image@2x_url": "https://assets.ppy.sh/profile-badges/badge_owc2020_winner@2x.png",
                localId: "default-5",
            },
            {
                awarded_at: new Date("2019-12-01"),
                description: "osu! World Cup 2019 Winner",
                image_url: "https://assets.ppy.sh/profile-badges/owc2019_winner.png",
                "image@2x_url": "https://assets.ppy.sh/profile-badges/owc2019_winner@2x.png",
                localId: "default-6",
            },
            {
                awarded_at: new Date("2018-12-01"),
                description: "osu! World Cup 2018 Winner",
                image_url: "https://assets.ppy.sh/profile-badges/owc2018_winner.png",
                "image@2x_url": "https://assets.ppy.sh/profile-badges/owc2018_winner@2x.png",
                localId: "default-7",
            },
            {
                awarded_at: new Date("2017-12-01"),
                description: "osu! World Cup 2017 Winner",
                image_url: "https://assets.ppy.sh/profile-badges/o_wc2017_winner.png",
                "image@2x_url": "https://assets.ppy.sh/profile-badges/o_wc2017_winner@2x.png",
                localId: "default-8",
            },
            {
                awarded_at: new Date("2016-12-01"),
                description: "osu! World Cup 2016 Winner",
                image_url: "https://assets.ppy.sh/profile-badges/o_wc2016_winner.png",
                "image@2x_url": "https://assets.ppy.sh/profile-badges/o_wc2016_winner@2x.png",
                localId: "default-9",
            },
            {
                awarded_at: new Date("2015-12-01"),
                description: "osu! World Cup 2015 Winner",
                image_url: "https://assets.ppy.sh/profile-badges/owc2015-1st.png",
                "image@2x_url": "https://assets.ppy.sh/profile-badges/owc2015-1st@2x.png",
                localId: "default-10",
            },
            {
                awarded_at: new Date("2014-12-01"),
                description: "osu! World Cup 2014 Winner",
                image_url: "https://assets.ppy.sh/profile-badges/owc2014-1st.png",
                "image@2x_url": "https://assets.ppy.sh/profile-badges/owc2014-1st@2x.png",
                localId: "default-11",
            },
        ],
    };

    const [user, setUser] = useState<LocalUser>(DEFAULT_USER);

    // Use our custom badge manager hook
    const {
        isAddingBadge,
        newBadge,
        setNewBadge,
        imageLoading,
        processImageFile,
        handleCloseModal,
        addBadgeToUser,
        deleteBadge,
        cleanupUrls,
        ensureBadgeIds,
    } = useBadgePreviewer();

    // Handle file drop for badge
    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            if (acceptedFiles.length > 0) {
                const file = acceptedFiles[0];
                if (file.type.startsWith("image/")) {
                    processImageFile(file);
                } else {
                    notifications.show({
                        title: "Invalid file type",
                        message: "Please upload an image file",
                        color: "red",
                    });
                }
            }
        },
        [processImageFile]
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
                        processImageFile(file);
                        break;
                    }
                }
            }
        };

        window.addEventListener("paste", handlePaste);
        return () => window.removeEventListener("paste", handlePaste);
    }, [searchParams, processImageFile]);

    // Clean up object URLs when component unmounts
    useEffect(() => {
        return () => {
            cleanupUrls();
        };
    }, [cleanupUrls]);

    const handleLoadUser = useCallback(() => {
        const trimmedInput = userInput.trim();
        if (trimmedInput) {
            setSearchQuery(trimmedInput);
        }
    }, [userInput]);

    const handleAddBadge = useCallback(() => {
        const updatedBadges = addBadgeToUser(user.badges);
        if (updatedBadges) {
            setUser((prev) => ({
                ...prev,
                badges: updatedBadges,
            }));
        }
    }, [user.badges, addBadgeToUser]);

    // Update user when API data is received
    useEffect(() => {
        if (osuUser) {
            // Clean up any local URLs before setting new user
            cleanupUrls();

            // Add localId to any badges from the API that don't have one
            const userWithLocalIds = {
                ...osuUser,
                badges: ensureBadgeIds(osuUser.badges),
            };

            setUser(userWithLocalIds);
            setUserInput("");
            setSearchQuery("");
        }
    }, [osuUser, cleanupUrls, ensureBadgeIds]);

    const handleDeleteBadge = useCallback(
        (badgeToDelete: LocalBadge) => {
            const updatedBadges = deleteBadge(badgeToDelete, user.badges);
            setUser((prev) => ({
                ...prev,
                badges: updatedBadges,
            }));
        },
        [user.badges, deleteBadge]
    );

    // Render the search section based on login status
    const renderSearchSection = () => {
        return (
            <Card withBorder>
                <Group grow align="stretch">
                    <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                        {!loggedInUser ? (
                            <SignInBanner
                                text="You need to sign in with your osu! account to load an osu! profile."
                                hideLoginButton
                            />
                        ) : (
                            <>
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
                            </>
                        )}
                    </div>

                    <Paper
                        {...getRootProps()}
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
                            padding: "1rem",
                            minHeight: "80px",
                            height: "100%",
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
        );
    };

    if (isLoading) {
        return skeleton;
    }

    return (
        <Stack mt="xl" gap="xl">
            {/* Search Section */}
            {renderSearchSection()}

            <OsuProfile user={user} onDeleteBadge={handleDeleteBadge} />

            {/* Badge Add Modal */}
            <Modal opened={isAddingBadge} onClose={handleCloseModal} title="Add New Badge">
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
