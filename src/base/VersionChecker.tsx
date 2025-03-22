import { useEffect } from "react";
import { Button } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useVersion } from "../hooks/useVersion";

// This will be replaced by Vite at build time
declare const __COMMIT_HASH__: string;

export default function VersionChecker() {
    const { data: version } = useVersion();
    const currentHash = __COMMIT_HASH__;

    useEffect(() => {
        const checkVersion = () => {
            try {
                // Only show notification if we have both hashes and they don't match
                if (version?.hash && currentHash && version.hash !== currentHash && version.hash !== "unknown") {
                    notifications.show({
                        id: "version-check",
                        color: "primary.10",
                        title: "Website out of date!",
                        message: (
                            <Button
                                variant="filled"
                                color="primary"
                                onClick={() => window.location.reload()}
                                mt="sm"
                                leftSection={<FontAwesomeIcon icon="arrows-rotate" />}>
                                Refresh to get the latest version
                            </Button>
                        ),
                        autoClose: false,
                        withCloseButton: false,
                    });
                }
            } catch (error) {
                console.error("Failed to check website version:", error);
            }
        };

        // Check version when it changes
        checkVersion();

        // Check every minute
        const interval = setInterval(checkVersion, 60 * 1000);
        return () => clearInterval(interval);
    }, [version?.hash, currentHash]);

    return null;
}
