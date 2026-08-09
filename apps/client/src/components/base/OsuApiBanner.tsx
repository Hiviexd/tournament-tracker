import { useEffect, useRef } from "react";
import { Box, Text } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useStatus } from "../../hooks/useStatus";

const BANNER_MESSAGE = "The osu! API is temporarily unavailable. Some features may not work.";

export default function OsuApiBanner() {
    const { data: status } = useStatus();
    const isDown = status?.osuApi.status === "down";
    const bannerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const root = document.documentElement;

        if (!isDown) {
            root.style.setProperty("--osu-api-banner-height", "0px");
            delete root.dataset.osuApiBannerVisible;
            return;
        }

        root.dataset.osuApiBannerVisible = "true";

        const banner = bannerRef.current;
        if (!banner) {
            return;
        }

        const updateHeight = () => {
            root.style.setProperty("--osu-api-banner-height", `${banner.offsetHeight}px`);
        };

        updateHeight();

        const observer = new ResizeObserver(updateHeight);
        observer.observe(banner);

        return () => {
            observer.disconnect();
            root.style.setProperty("--osu-api-banner-height", "0px");
            delete root.dataset.osuApiBannerVisible;
        };
    }, [isDown]);

    if (!isDown) {
        return null;
    }

    return (
        <Box
            ref={bannerRef}
            className="osu-api-banner"
            style={
                {
                    "--osu-api-banner-background": "var(--mantine-color-red-9)",
                } as React.CSSProperties
            }>
            <Text size="xs" fw={600} className="banner-text">
                <FontAwesomeIcon icon="triangle-exclamation" />
                {BANNER_MESSAGE}
            </Text>
        </Box>
    );
}
