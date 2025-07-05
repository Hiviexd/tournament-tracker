import { useEffect } from "react";
import { Button } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useVersion } from "../../hooks/useVersion";

// This will be replaced by Vite at build time
declare const __COMMIT_HASH__: string;

export default function VersionChecker() {
    const { data: version } = useVersion();
    const currentHash = __COMMIT_HASH__;

    useEffect(() => {
        // Only show notification if we:
        // - have both hashes
        // - they don't match
        // - skip flag is not present in backend commit message
        const skipRefresh = version?.message?.includes("--skip-client-refresh");
        if (
            version?.hash &&
            currentHash &&
            version.hash !== currentHash &&
            version.hash !== "unknown" &&
            !skipRefresh
        ) {
            notifications.show({
                id: "version-check",
                color: "primary",
                title: "Website out of date!",
                position: "bottom-center",
                message: (
                    <Button
                        mt="3px"
                        variant="white"
                        color="primary"
                        onClick={() => window.location.reload()}
                        leftSection={<FontAwesomeIcon icon="arrows-rotate" className="animation-spin" />}>
                        Refresh to get the latest version
                    </Button>
                ),
                autoClose: false,
                withCloseButton: false,
                style: {
                    width: "fit-content",
                },
            });
        }
    }, [version?.hash, currentHash, version?.message]);

    return null;
}
