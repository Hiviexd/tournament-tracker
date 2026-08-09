import { useState, useRef, useCallback } from "react";
import { notifications } from "@mantine/notifications";
import { IOsuBadge } from "@tc/types/OsuApi";

// Extend IOsuBadge to include a local ID for tracking
export interface LocalBadge extends IOsuBadge {
    localId: string;
    dimensions?: { width: number; height: number };
}

// Valid badge dimensions
const VALID_DIMENSIONS = [
    { width: 86, height: 40 },
    { width: 172, height: 80 },
];

export function useBadgePreviewer() {
    const [isAddingBadge, setIsAddingBadge] = useState(false);
    const [newBadge, setNewBadge] = useState<Partial<LocalBadge>>({
        description: "",
        awarded_at: new Date(),
        localId: "",
    });
    const [imageLoading, setImageLoading] = useState(false);

    // Use a ref to track active URLs to prevent them from being revoked while in use
    const activeUrlsRef = useRef<Map<string, string>>(new Map());

    // Generate a unique ID for badges
    const generateUniqueId = useCallback(() => {
        return `badge_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    }, []);

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
        return VALID_DIMENSIONS.some((dim) => dim.width === width && dim.height === height);
    }, []);

    // Function to safely add a URL to our tracking
    const trackUrl = useCallback((localId: string, url: string) => {
        activeUrlsRef.current.set(localId, url);
    }, []);

    // Function to safely revoke a URL if it's no longer needed
    const revokeUrl = useCallback((localId: string) => {
        const url = activeUrlsRef.current.get(localId);
        if (url && !url.startsWith("https://")) {
            URL.revokeObjectURL(url);
            activeUrlsRef.current.delete(localId);
        }
    }, []);

    // Function to process an image file (used by both drop and paste handlers)
    const processImageFile = useCallback(
        (file: File) => {
            setImageLoading(true);

            checkImageDimensions(file)
                .then((dimensions) => {
                    if (isValidBadgeDimension(dimensions.width, dimensions.height)) {
                        const url = URL.createObjectURL(file);
                        const localId = generateUniqueId();

                        // Track the new URL
                        trackUrl(localId, url);

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
        },
        [checkImageDimensions, isValidBadgeDimension, generateUniqueId, trackUrl],
    );

    // Reset modal state when closing
    const handleCloseModal = useCallback(() => {
        // If we're closing without adding, revoke the URL
        if (newBadge.localId && newBadge["image@2x_url"]) {
            revokeUrl(newBadge.localId);
        }

        setIsAddingBadge(false);
        setNewBadge({
            description: "",
            awarded_at: new Date(),
            localId: "",
        });
    }, [newBadge, revokeUrl]);

    // Function to add a badge to a user's badges
    const addBadgeToUser = useCallback(
        (badges: LocalBadge[] = []) => {
            if (!newBadge.description || !newBadge["image@2x_url"] || !newBadge.localId) {
                notifications.show({
                    title: "Missing information",
                    message: "Please provide both an image and description for the badge",
                    color: "red",
                });
                return null;
            }

            // Add the badge to the badges array
            const updatedBadges = [...badges, newBadge as LocalBadge];

            // Reset form without revoking URL (since it's now used in the badge list)
            setNewBadge({
                description: "",
                awarded_at: new Date(),
                localId: "",
            });
            setIsAddingBadge(false);

            return updatedBadges;
        },
        [newBadge],
    );

    // Function to delete a badge
    const deleteBadge = useCallback(
        (badgeToDelete: LocalBadge, badges: LocalBadge[] = []) => {
            // If it's a local badge with a local URL, revoke it
            if (
                badgeToDelete.localId &&
                badgeToDelete["image@2x_url"] &&
                !badgeToDelete["image@2x_url"].startsWith("https://")
            ) {
                revokeUrl(badgeToDelete.localId);
            }

            // Remove the badge from badges array
            return badges.filter((badge) => badge.localId !== badgeToDelete.localId);
        },
        [revokeUrl],
    );

    // Function to clean up all URLs
    const cleanupUrls = useCallback(() => {
        activeUrlsRef.current.forEach((url) => {
            if (!url.startsWith("https://")) {
                URL.revokeObjectURL(url);
            }
        });
        activeUrlsRef.current.clear();
    }, []);

    // Function to ensure all badges have localIds
    const ensureBadgeIds = useCallback(
        (badges: IOsuBadge[] = []) => {
            return badges.map((badge) => ({
                ...badge,
                localId: (badge as LocalBadge).localId || generateUniqueId(),
            })) as LocalBadge[];
        },
        [generateUniqueId],
    );

    return {
        isAddingBadge,
        setIsAddingBadge,
        newBadge,
        setNewBadge,
        imageLoading,
        processImageFile,
        handleCloseModal,
        addBadgeToUser,
        deleteBadge,
        cleanupUrls,
        ensureBadgeIds,
        generateUniqueId,
        VALID_DIMENSIONS,
    };
}
