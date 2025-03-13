import { useState, useCallback, useEffect } from "react";
import { Text, Stack, Paper, Center } from "@mantine/core";
import { useDropzone } from "react-dropzone";
import { notifications } from "@mantine/notifications";
import defaultBanner from "/assets/default-banner.jpg";

interface BannerPreview {
    description: string;
    author: string;
    date: string;
    imageUrl: string;
}

const DEFAULT_PREVIEW: BannerPreview = {
    description:
        "Long description text goes here. Reasonably long, two lines, gotta keep typing or else we'll have to make this even longer to unreasonable degrees!",
    author: "You & Me",
    date: "16 Dec 2024",
    imageUrl: defaultBanner,
};

export default function NewsBannersTab() {
    const [preview, setPreview] = useState<BannerPreview>(DEFAULT_PREVIEW);

    // Handle file drop
    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            const file = acceptedFiles[0];
            if (file.type.startsWith("image/")) {
                const url = URL.createObjectURL(file);
                setPreview((prev) => ({ ...prev, imageUrl: url }));
            } else {
                notifications.show({
                    title: "Invalid file type",
                    message: "Please upload an image file",
                    color: "red",
                });
            }
        }
    }, []);

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
            const items = e.clipboardData?.items;
            if (!items) return;

            for (const item of Array.from(items)) {
                if (item.type.startsWith("image/")) {
                    const file = item.getAsFile();
                    if (file) {
                        const url = URL.createObjectURL(file);
                        setPreview((prev) => ({ ...prev, imageUrl: url }));
                        break;
                    }
                }
            }
        };

        window.addEventListener("paste", handlePaste);
        return () => window.removeEventListener("paste", handlePaste);
    }, []);

    // Clean up object URLs when component unmounts or preview changes
    useEffect(() => {
        return () => {
            // Only revoke if it's not the default image
            if (preview.imageUrl && !preview.imageUrl.startsWith("/assets/")) {
                URL.revokeObjectURL(preview.imageUrl);
            }
        };
    }, [preview.imageUrl]);

    // Reset to default image
    const handleReset = useCallback(() => {
        // Clean up any existing object URL first
        if (preview.imageUrl && !preview.imageUrl.startsWith("/assets/")) {
            URL.revokeObjectURL(preview.imageUrl);
        }
        setPreview((prev) => ({ ...prev, imageUrl: DEFAULT_PREVIEW.imageUrl }));
    }, [preview.imageUrl]);

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
                    transition: "all 0.2s ease",
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
                <Center mt={10}>
                    <Text
                        component="span"
                        size="sm"
                        c="primary"
                        style={{ cursor: "pointer" }}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleReset();
                        }}>
                        Reset to default banner
                    </Text>
                </Center>
            </Paper>

            {/* Preview section */}
            <Stack gap="xl" align="center">
                {/* Homepage logged in */}
                <div className="newspost newspost-homepage">
                    <div className="newspost-image">
                        <img src={preview.imageUrl} alt="Preview" />
                    </div>
                    <div className="newspost-homepage-inner">
                        <div className="newspost-homepage-date">
                            <p className="newspost-homepage-date-day">16</p>
                            <p className="newspost-homepage-date-month">Dec 2024</p>
                        </div>
                        <div className="newspost-homepage-texts">
                            <p className="newspost-homepage-title">Newspost on homepage (logged in)</p>
                            <p className="newspost-homepage-description">{preview.description}</p>
                        </div>
                    </div>
                </div>

                {/* News history page */}
                <div className="newspost newspost-listing">
                    <div className="newspost-image">
                        <img src={preview.imageUrl} alt="Preview" />
                    </div>
                    <div className="newspost-listing-inner">
                        <p className="newspost-listing-title">Newspost on news history page</p>
                        <p className="newspost-listing-description">{preview.description}</p>
                        <p className="newspost-listing-meta">
                            by <strong>{preview.author}</strong>
                        </p>
                    </div>
                </div>

                {/* Homepage logged out (small) */}
                <div className="newspost newspost-loggedout small">
                    <div className="newspost-image">
                        <img src={preview.imageUrl} alt="Preview" />
                    </div>
                    <div className="newspost-loggedout-inner">
                        <p className="newspost-loggedout-title">Small newspost on homepage (logged out)</p>
                        <p className="newspost-listing-meta">
                            by <strong>{preview.author}</strong>
                        </p>
                    </div>
                </div>

                {/* Homepage logged out (large) */}
                <div className="newspost newspost-loggedout">
                    <div className="newspost-image">
                        <img src={preview.imageUrl} alt="Preview" />
                    </div>
                    <div className="newspost-loggedout-inner">
                        <p className="newspost-loggedout-title">Large newspost on homepage (logged out)</p>
                        <p className="newspost-listing-meta">
                            by <strong>{preview.author}</strong>
                        </p>
                    </div>
                </div>

                {/* Newspost page */}
                <div className="newspost newspost-newspost">
                    <div className="newspost-newspost-inner">
                        <div className="newspost-image">
                            <img src={preview.imageUrl} alt="Preview" />
                        </div>
                        <p className="newspost-newspost-title">Newspost on newspost page</p>
                        <p className="newspost-newspost-meta">
                            by <strong>{preview.author}</strong>
                        </p>
                    </div>

                    <p className="newspost-newspost-description">{preview.description}</p>
                </div>
            </Stack>
        </Stack>
    );
}
