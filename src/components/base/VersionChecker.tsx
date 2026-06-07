import { useEffect } from "react";
import { Button } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useStatus } from "../../hooks/useStatus";

// This will be replaced by Vite at build time
declare const __COMMIT_HASH__: string;

export default function VersionChecker() {
    const { data: status, isSuccess } = useStatus();
    const version = status?.version;
    const currentHash = __COMMIT_HASH__;

    useEffect(() => {
        if (!isSuccess || !version?.hash || !currentHash) {
            return;
        }

        const skipRefresh = version.message?.includes("--skip-client-refresh");
        const isOutdated =
            version.hash !== currentHash && version.hash !== "unknown" && !skipRefresh;

        if (isOutdated) {
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
                    marginLeft: "auto",
                    marginRight: "auto",
                    marginBottom:
                        "calc(var(--osu-api-banner-height, 0px) + var(--environment-banner-height, 0px) + 12px)",
                },
            });
            return;
        }

        notifications.hide("version-check");
    }, [isSuccess, version?.hash, currentHash, version?.message]);

    return null;
}
