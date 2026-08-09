import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { Text, Stack, Paper, Center, Group, Card, Button, Flex, SegmentedControl } from "@mantine/core";
import { useDropzone } from "react-dropzone";
import { notifications } from "@mantine/notifications";
import defaultStableBackground from "/assets/default-bg-stable.jpg";
import defaultLazerBackground from "/assets/default-bg-lazer.jpg";
import utils from "@tc/utils/client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import OsuWebPreview from "./OsuWebPreview";

interface BannerPreview {
    bannerUrl: string;
    backgroundUrl: string;
    isLocalBanner: boolean;
    isLocalBackground: boolean;
}

export default function InGameBannersTab() {
    const [currentBannerUrl, setCurrentBannerUrl] = useState<string | null>(null);
    const [currentBackgroundUrl, setCurrentBackgroundUrl] = useState<string | null>(null);
    const [isHovered, setIsHovered] = useState(false);
    const [isLazer, setIsLazer] = useState(false);
    const [previewMode, setPreviewMode] = useState<"stable" | "lazer" | "web">("stable");
    const bannerImageRef = useRef<HTMLImageElement>(null);
    const animationRef = useRef<number | null>(null);

    const DEFAULT_PREVIEW = useMemo(
        () => ({
            bannerUrl: "https://assets.ppy.sh/main-menu/2025-spring-fanart-submissions@2x.png",
            backgroundUrl: isLazer ? defaultLazerBackground : defaultStableBackground,
            isLocalBanner: false,
            isLocalBackground: false,
        }),
        [isLazer],
    );

    const [preview, setPreview] = useState<BannerPreview>(DEFAULT_PREVIEW);

    // Compute background URL based on current state
    const backgroundUrl = useMemo(() => {
        if (preview.isLocalBackground) {
            return preview.backgroundUrl;
        }
        return isLazer ? defaultLazerBackground : defaultStableBackground;
    }, [preview.isLocalBackground, preview.backgroundUrl, isLazer]);

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
        [currentBannerUrl],
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
        [currentBackgroundUrl],
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
    }, [cleanupUrls, DEFAULT_PREVIEW]);

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

    // Stable animation
    const animateStableBanner = useCallback((targetScale: number) => {
        if (!bannerImageRef.current) return;

        // Cancel any ongoing animation
        if (animationRef.current !== null) {
            cancelAnimationFrame(animationRef.current);
        }

        const startTime = performance.now();
        const duration = 500;
        const element = bannerImageRef.current;

        // Get current scale from transform or default to 1
        const currentTransform = element.style.transform;
        const currentScaleMatch = currentTransform.match(/scale\(([0-9.]+)\)/);
        const startScale = currentScaleMatch ? parseFloat(currentScaleMatch[1]) : 1;

        // Use the easing functions from utils
        const easing = targetScale > startScale ? utils.easingOutBounce : utils.easingOutCubic;

        const animate = (time: number) => {
            const elapsed = time - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easing(progress);

            const newScale = startScale + (targetScale - startScale) * easedProgress;
            element.style.transform = `scale(${newScale})`;

            if (progress < 1) {
                animationRef.current = requestAnimationFrame(animate);
            } else {
                animationRef.current = null;
            }
        };

        animationRef.current = requestAnimationFrame(animate);
    }, []);

    // Handle hover events
    const handleMouseEnter = useCallback(() => {
        setIsHovered(true);

        if (!isLazer && bannerImageRef.current) {
            animateStableBanner(1.1);
        }
    }, [isLazer, animateStableBanner]);

    const handleMouseLeave = useCallback(() => {
        setIsHovered(false);

        if (!isLazer && bannerImageRef.current) {
            animateStableBanner(1.0);
        }
    }, [isLazer, animateStableBanner]);

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
                            transition: "border-color 0.2s ease, background-color 0.2s ease",
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
                            transition: "border-color 0.2s ease, background-color 0.2s ease",
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
                    <Button
                        size="sm"
                        variant="light"
                        onClick={handleReset}
                        leftSection={<FontAwesomeIcon icon="arrows-rotate" />}>
                        Reset to defaults
                    </Button>
                </Center>
            </Card>

            {/* Mode Switch */}
            <Flex justify="center" align="center" gap="md">
                <SegmentedControl
                    color="primary"
                    withItemsBorders={false}
                    value={previewMode}
                    onChange={(value) => {
                        setPreviewMode(value as "stable" | "lazer" | "web");
                        setIsLazer(value === "lazer");
                    }}
                    data={[
                        { label: "osu!(stable)", value: "stable" },
                        { label: "osu!(lazer)", value: "lazer" },
                        { label: "osu!(web)", value: "web" },
                    ]}
                    styles={{
                        root: {
                            backgroundColor: "var(--mantine-color-primary-11)",
                            border: "1px solid var(--mantine-color-default-border)",
                            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
                        },
                    }}
                />
            </Flex>

            {/* Preview section */}
            {previewMode === "web" ? (
                <OsuWebPreview bannerUrl={preview.bannerUrl} />
            ) : (
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
                            backgroundImage: `url(${backgroundUrl})`,
                            backgroundPosition: "center bottom",
                            backgroundSize: "cover",
                        }}
                    />

                    {/* Darkening Overlay */}
                    {!isLazer && (
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
                    )}

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
                        className={`banner-container ${isLazer ? "lazer-mode" : "stable-mode"}`}>
                        <img
                            ref={bannerImageRef}
                            src={preview.bannerUrl}
                            alt="In-game banner"
                            style={{
                                maxWidth: "100%",
                                maxHeight: "120px",
                                objectFit: "contain",
                                transform: isLazer ? `scale(${isHovered ? 1.05 : 1})` : undefined,
                                transformOrigin: "bottom center",
                                transition: isLazer
                                    ? isHovered
                                        ? "transform 2s cubic-bezier(0.23, 1, 0.32, 1), filter 2s cubic-bezier(0.23, 1, 0.32, 1)"
                                        : "transform 0.5s cubic-bezier(0.23, 1, 0.32, 1), filter 0.5s cubic-bezier(0.23, 1, 0.32, 1)"
                                    : undefined,
                                filter: isHovered && isLazer ? "brightness(1.1)" : "brightness(1)",
                                display: "block",
                                marginBottom: 0,
                            }}
                            className={`banner-image ${isLazer ? "lazer-mode" : "stable-mode"}`}
                        />
                    </div>
                </div>
            )}
        </Stack>
    );
}
