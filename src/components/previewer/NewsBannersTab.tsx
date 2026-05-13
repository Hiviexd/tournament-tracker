import { useState, useCallback, useEffect, useRef } from "react";
import { Text, Stack, Paper, Center, Button, Modal, Group } from "@mantine/core";
import { useDropzone } from "react-dropzone";
import { notifications } from "@mantine/notifications";
import { useSearchParams } from "react-router-dom";
import defaultBanner from "/assets/default-banner.jpg";
import dayjs from "dayjs";
import { useDisclosure } from "@mantine/hooks";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { loggedInUserAtom } from "../../store/atoms";
import { useAtom } from "jotai";

interface BannerPreview {
    description: string;
    author: string;
    date: { day: string; month: string; year: string };
    imageUrl: string;
    isLocalImage?: boolean;
}

const DEFAULT_PREVIEW: BannerPreview = {
    description:
        "Long description text goes here. Reasonably long, two lines, gotta keep typing or else we'll have to make this even longer to unreasonable degrees!",
    author: "You & Me",
    date: { day: dayjs().format("D"), month: dayjs().format("MMM"), year: dayjs().format("YYYY") },
    imageUrl: defaultBanner,
    isLocalImage: false,
};

function HomepageLoggedInBannerPreview({ preview }: { preview: BannerPreview }) {
    return (
        <div className="newspost newspost-homepage">
            <div className="newspost-image">
                <img src={preview.imageUrl} alt="Preview" />
            </div>
            <div className="newspost-homepage-inner">
                <div className="newspost-homepage-date">
                    <p className="newspost-homepage-date-day">{preview.date.day}</p>
                    <p className="newspost-homepage-date-month">
                        {preview.date.month} {preview.date.year}
                    </p>
                </div>
                <div className="newspost-homepage-texts">
                    <p className="newspost-homepage-title">Newspost in homepage (logged in)</p>
                    <p className="newspost-homepage-description">{preview.description}</p>
                </div>
            </div>
        </div>
    );
}

function NewsHistoryPagePreview({ preview, authorLabel }: { preview: BannerPreview; authorLabel: string }) {
    return (
        <div className="newspost newspost-listing">
            <div className="newspost-image">
                <img src={preview.imageUrl} alt="Preview" />
                <div className="newspost-date-badge">
                    {preview.date.day} {preview.date.month} {preview.date.year}
                </div>
            </div>
            <div className="newspost-listing-inner">
                <p className="newspost-listing-title">Newspost in news history page</p>
                <p className="newspost-listing-description">{preview.description}</p>
                <p className="newspost-listing-meta">
                    by <strong>{authorLabel}</strong>
                </p>
            </div>
        </div>
    );
}

function HomepageLoggedOutSmallBannerPreview({ preview, authorLabel }: { preview: BannerPreview; authorLabel: string }) {
    return (
        <div className="newspost newspost-loggedout small">
            <div className="newspost-image">
                <img src={preview.imageUrl} alt="Preview" />
                <div className="newspost-date-badge">
                    {preview.date.day} {preview.date.month} {preview.date.year}
                </div>
            </div>
            <div className="newspost-loggedout-inner">
                <p className="newspost-loggedout-title">Small newspost in homepage (logged out)</p>
                <p className="newspost-listing-meta">
                    by <strong>{authorLabel}</strong>
                </p>
            </div>
        </div>
    );
}

function HomepageLoggedOutLargeBannerPreview({ preview, authorLabel }: { preview: BannerPreview; authorLabel: string }) {
    return (
        <div className="newspost newspost-loggedout">
            <div className="newspost-image">
                <img src={preview.imageUrl} alt="Preview" />
                <div className="newspost-date-badge">
                    {preview.date.day} {preview.date.month} {preview.date.year}
                </div>
            </div>
            <div className="newspost-loggedout-inner">
                <p className="newspost-loggedout-title">Large newspost in homepage (logged out)</p>
                <p className="newspost-listing-meta">
                    by <strong>{authorLabel}</strong>
                </p>
            </div>
        </div>
    );
}

function NewsPagePreview({ preview, authorLabel }: { preview: BannerPreview; authorLabel: string }) {
    return (
        <div className="newspost newspost-newspost">
            <div className="newspost-newspost-inner">
                <div className="newspost-image">
                    <img src={preview.imageUrl} alt="Preview" />
                    <div className="newspost-date-badge">
                        {preview.date.day} {preview.date.month} {preview.date.year}
                    </div>
                </div>
                <p className="newspost-newspost-title">Newspost in newspost page</p>
                <p className="newspost-newspost-meta">
                    by <strong>{authorLabel}</strong>
                </p>
            </div>

            <p className="newspost-newspost-description">{preview.description}</p>
        </div>
    );
}

export default function NewsBannersTab() {
    const [user] = useAtom(loggedInUserAtom);
    const [searchParams] = useSearchParams();
    const [preview, setPreview] = useState<BannerPreview>(DEFAULT_PREVIEW);
    const [currentUrl, setCurrentUrl] = useState<string | null>(null);
    const currentUrlRef = useRef<string | null>(null);
    const [opened, { open: openModal, close: closeModal }] = useDisclosure(false);

    // Handle file drop
    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            if (acceptedFiles.length > 0) {
                const file = acceptedFiles[0];
                if (file.type.startsWith("image/")) {
                    // Clean up previous URL if it exists
                    if (currentUrl) {
                        URL.revokeObjectURL(currentUrl);
                    }
                    const url = URL.createObjectURL(file);
                    setCurrentUrl(url);
                    setPreview((prev) => ({
                        ...prev,
                        imageUrl: url,
                        isLocalImage: true,
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
        [currentUrl]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
        },
        maxFiles: 1,
    });

    // Handle paste
    useEffect(() => {
        const handlePaste = (e: ClipboardEvent) => {
            // Only process paste events when news-banners tab is active
            const currentTab = searchParams.get("tab") || "badges";
            if (currentTab !== "news-banners") return;

            const items = e.clipboardData?.items;
            if (!items) return;

            for (const item of Array.from(items)) {
                if (item.type.startsWith("image/")) {
                    const file = item.getAsFile();
                    if (file) {
                        // Clean up previous URL if it exists
                        if (currentUrlRef.current) {
                            URL.revokeObjectURL(currentUrlRef.current);
                        }
                        const url = URL.createObjectURL(file);
                        currentUrlRef.current = url;
                        setCurrentUrl(url);
                        setPreview((prev) => ({
                            ...prev,
                            imageUrl: url,
                            isLocalImage: true,
                        }));
                        break;
                    }
                }
            }
        };

        window.addEventListener("paste", handlePaste);
        return () => window.removeEventListener("paste", handlePaste);
    }, [searchParams]);

    // Clean up object URLs when component unmounts
    useEffect(() => {
        return () => {
            if (currentUrlRef.current) {
                URL.revokeObjectURL(currentUrlRef.current);
            }
        };
    }, []);

    // Reset to default image
    const handleReset = useCallback(() => {
        // Clean up current URL if it exists
        if (currentUrlRef.current) {
            URL.revokeObjectURL(currentUrlRef.current);
            currentUrlRef.current = null;
            setCurrentUrl(null);
        }
        setPreview(DEFAULT_PREVIEW);
    }, []);

    const authorLabel = user?.username ?? preview.author;

    return (
        <Stack gap="xl" className="news-banner-previewer">
            {/* Drop zone */}
            <Paper
                {...getRootProps()}
                my="xl"
                p="xl"
                className="dropzone"
                style={{
                    border: `2px dashed var(--mantine-color-${isDragActive ? "primary" : "gray"}-4)`,
                    backgroundColor: isDragActive ? "var(--mantine-color-primary-light)" : "var(--mantine-color-body)",
                    cursor: "pointer",
                    transition: "border-color 0.2s ease, background-color 0.2s ease",
                }}>
                <input {...getInputProps()} />
                <Center>
                    <Text size="lg" c={isDragActive ? "primary" : "dimmed"}>
                        {isDragActive ? "Drop the image here..." : "Drag an image here, or click to select one"}
                    </Text>
                </Center>
                <Center mt={5}>
                    <Text size="sm" c="dimmed">
                        You can also paste (CTRL+V) an image anywhere on this page
                    </Text>
                </Center>
                <Center mt={10} style={{ gap: "var(--mantine-spacing-sm)" }}>
                    <Button
                        size="sm"
                        variant="light"
                        style={{ cursor: "default" }}
                        leftSection={<FontAwesomeIcon icon="arrows-rotate" />}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleReset();
                        }}>
                        Reset to default banner
                    </Button>
                    <Button
                        size="sm"
                        variant="light"
                        style={{ cursor: "default" }}
                        leftSection={<FontAwesomeIcon icon="image" />}
                        onClick={(e) => {
                            e.stopPropagation();
                            openModal();
                        }}>
                        Show screenshot format
                    </Button>
                </Center>
            </Paper>

            {/* Preview section */}
            <Stack gap="xl" align="center" className="banners-container">
                {/* Homepage logged in */}
                <HomepageLoggedInBannerPreview preview={preview} />

                {/* News history page */}
                <NewsHistoryPagePreview preview={preview} authorLabel={authorLabel} />

                {/* Homepage logged out (small) */}
                <HomepageLoggedOutSmallBannerPreview preview={preview} authorLabel={authorLabel} />

                {/* Homepage logged out (large) */}
                <HomepageLoggedOutLargeBannerPreview preview={preview} authorLabel={authorLabel} />

                {/* Newspost page */}
                <NewsPagePreview preview={preview} authorLabel={authorLabel} />
            </Stack>

            {/* Screenshot Modal */}
            <Modal
                opened={opened}
                onClose={closeModal}
                fullScreen
                title="News Banner Previews - Screenshot Format"
                styles={{
                    content: {
                        backgroundColor: "var(--mantine-color-body)",
                    },
                    header: {
                        backgroundColor: "var(--mantine-color-body)",
                        borderBottom: "1px solid var(--mantine-color-dark-4)",
                        marginBottom: "var(--mantine-spacing-md)",
                    },
                    body: {
                        padding: "var(--mantine-spacing-md)",
                    },
                }}>
                <div className="news-banner-previewer">
                    <div className="banners-container" style={{ padding: "20px" }}>
                        <Group align="center" justify="center">
                            <HomepageLoggedInBannerPreview preview={preview} />
                            <HomepageLoggedOutSmallBannerPreview preview={preview} authorLabel={authorLabel} />
                            <NewsHistoryPagePreview preview={preview} authorLabel={authorLabel} />
                            <HomepageLoggedOutLargeBannerPreview preview={preview} authorLabel={authorLabel} />
                            <NewsPagePreview preview={preview} authorLabel={authorLabel} />
                        </Group>
                    </div>
                </div>
            </Modal>
        </Stack>
    );
}
