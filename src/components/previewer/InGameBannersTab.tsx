import { useState, useCallback, useEffect } from "react";
import { Text, Stack, Paper, Center, Group, Card, Button } from "@mantine/core";
import { useDropzone } from "react-dropzone";
import { notifications } from "@mantine/notifications";
import defaultBackground from "/assets/default-bg.jpg";

interface BannerPreview {
    bannerUrl: string;
    backgroundUrl: string;
    isLocalBanner: boolean;
    isLocalBackground: boolean;
}

const DEFAULT_PREVIEW: BannerPreview = {
    bannerUrl: "https://assets.ppy.sh/main-menu/2025-spring-fanart-submissions@2x.png",
    backgroundUrl: defaultBackground,
    isLocalBanner: false,
    isLocalBackground: false,
};

export default function InGameBannersTab() {
    const [preview, setPreview] = useState<BannerPreview>(DEFAULT_PREVIEW);
    const [currentBannerUrl, setCurrentBannerUrl] = useState<string | null>(null);
    const [currentBackgroundUrl, setCurrentBackgroundUrl] = useState<string | null>(null);
    const [isHovered, setIsHovered] = useState(false);

    // Handle banner drop
    const onBannerDrop = useCallback(
        (acceptedFiles: File[]) => {
            if (acceptedFiles.length > 0) {
                const file = acceptedFiles[0];
                if (file.type.startsWith("image/")) {
                    // Clean up previous URL if it exists
                    if (currentBannerUrl) {
                        URL.revokeObjectURL(currentBannerUrl);
                    }
                    const url = URL.createObjectURL(file);
                    setCurrentBannerUrl(url);
                    setPreview((prev) => ({
                        ...prev,
                        bannerUrl: url,
                        isLocalBanner: true,
                    }));
                } else {
                    notifications.show({
                        title: "Invalid file type",
                        message: "Please upload an image file",
                        color: "red",
                    });
                }
            }
        },
        [currentBannerUrl]
    );

    // Handle background drop
    const onBackgroundDrop = useCallback(
        (acceptedFiles: File[]) => {
            if (acceptedFiles.length > 0) {
                const file = acceptedFiles[0];
                if (file.type.startsWith("image/")) {
                    // Clean up previous URL if it exists
                    if (currentBackgroundUrl) {
                        URL.revokeObjectURL(currentBackgroundUrl);
                    }
                    const url = URL.createObjectURL(file);
                    setCurrentBackgroundUrl(url);
                    setPreview((prev) => ({
                        ...prev,
                        backgroundUrl: url,
                        isLocalBackground: true,
                    }));
                } else {
                    notifications.show({
                        title: "Invalid file type",
                        message: "Please upload an image file",
                        color: "red",
                    });
                }
            }
        },
        [currentBackgroundUrl]
    );

    // Clean up object URLs when component unmounts
    const cleanupUrls = useCallback(() => {
        if (currentBannerUrl) {
            URL.revokeObjectURL(currentBannerUrl);
        }
        if (currentBackgroundUrl) {
            URL.revokeObjectURL(currentBackgroundUrl);
        }
    }, [currentBannerUrl, currentBackgroundUrl]);

    // Reset to default images
    const handleReset = useCallback(() => {
        cleanupUrls();
        setCurrentBannerUrl(null);
        setCurrentBackgroundUrl(null);
        setPreview(DEFAULT_PREVIEW);
    }, [cleanupUrls]);

    // Clean up object URLs when component unmounts
    useEffect(() => {
        return () => {
            cleanupUrls();
        };
    }, [cleanupUrls]);

    // Dropzone for banner
    const {
        getRootProps: getBannerRootProps,
        getInputProps: getBannerInputProps,
        isDragActive: isBannerDragActive,
    } = useDropzone({
        onDrop: onBannerDrop,
        accept: {
            "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
        },
        maxFiles: 1,
    });

    // Dropzone for background
    const {
        getRootProps: getBackgroundRootProps,
        getInputProps: getBackgroundInputProps,
        isDragActive: isBackgroundDragActive,
    } = useDropzone({
        onDrop: onBackgroundDrop,
        accept: {
            "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
        },
        maxFiles: 1,
    });

    // Handle hover events
    const handleMouseEnter = useCallback(() => {
        setIsHovered(true);
    }, []);

    const handleMouseLeave = useCallback(() => {
        setIsHovered(false);
    }, []);

    return (
        <Stack gap="xl" className="ingame-banner-previewer" mt="xl">
            {/* Dropzones */}
            <Card withBorder>
                <Group grow>
                    {/* Banner Dropzone */}
                    <Paper
                        {...getBannerRootProps()}
                        p="xl"
                        className="dropzone"
                        style={{
                            border: `2px dashed var(--mantine-color-${isBannerDragActive ? "primary" : "gray"}-4)`,
                            backgroundColor: isBannerDragActive
                                ? "var(--mantine-color-primary-light)"
                                : "var(--mantine-color-body)",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            minHeight: "120px",
                        }}>
                        <input {...getBannerInputProps()} />
                        <Center>
                            <Text size="sm" c={isBannerDragActive ? "primary" : "dimmed"}>
                                {isBannerDragActive
                                    ? "Drop the banner here..."
                                    : "Drag an in-game banner here, or click to select one"}
                            </Text>
                        </Center>
                    </Paper>

                    {/* Background Dropzone */}
                    <Paper
                        {...getBackgroundRootProps()}
                        p="xl"
                        className="dropzone"
                        style={{
                            border: `2px dashed var(--mantine-color-${isBackgroundDragActive ? "primary" : "gray"}-4)`,
                            backgroundColor: isBackgroundDragActive
                                ? "var(--mantine-color-primary-light)"
                                : "var(--mantine-color-body)",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            minHeight: "120px",
                        }}>
                        <input {...getBackgroundInputProps()} />
                        <Center>
                            <Text size="sm" c={isBackgroundDragActive ? "primary" : "dimmed"}>
                                {isBackgroundDragActive
                                    ? "Drop the background here..."
                                    : "Drag a background image here, or click to select one"}
                            </Text>
                        </Center>
                    </Paper>
                </Group>

                <Center mt="md">
                    <Button size="sm" variant="light" onClick={handleReset}>
                        Reset to defaults
                    </Button>
                </Center>
            </Card>

            {/* Preview section */}
            <div
                className="ingame-preview"
                style={{
                    position: "relative",
                    width: "100%",
                    height: "240px",
                    overflow: "hidden",
                    borderRadius: "6px",
                }}>
                {/* Background Image */}
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        backgroundImage: `url(${preview.backgroundUrl})`,
                        backgroundPosition: "center bottom",
                        backgroundSize: "cover",
                    }}
                />

                {/* Darkening Overlay */}
                <div
                    style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        width: "100%",
                        height: "120px",
                        background: "rgba(0, 0, 0, 0.36)",
                    }}
                />

                {/* Banner Image */}
                <div
                    style={{
                        position: "absolute",
                        bottom: 0,
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: "100vh",
                        maxWidth: "100vh",
                        textAlign: "center",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "flex-end",
                        height: "120px",
                        justifyContent: "center",
                        pointerEvents: "auto",
                    }}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    className="banner-container">
                    <img
                        src={preview.bannerUrl}
                        alt="In-game banner"
                        style={{
                            maxWidth: "100%",
                            maxHeight: "120px",
                            objectFit: "contain",
                            transform: `scale(${isHovered ? 1.05 * 1 : 1})`,
                            transformOrigin: "bottom center",
                            transition: isHovered
                                ? "transform 2s cubic-bezier(0.23, 1, 0.32, 1), filter 2s cubic-bezier(0.23, 1, 0.32, 1)"
                                : "transform 0.5s cubic-bezier(0.23, 1, 0.32, 1), filter 0.5s cubic-bezier(0.23, 1, 0.32, 1)",
                            filter: isHovered ? "brightness(1.1)" : "brightness(1)",
                            display: "block",
                            marginBottom: 0,
                        }}
                        className="banner-image"
                    />
                </div>
            </div>

            <Center>
                <Text size="xs" c="dimmed">
                    This is how the banner will mostly look like in the osu! main menu
                </Text>
            </Center>
        </Stack>
    );
}
