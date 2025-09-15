import { UnstyledButton, Text, Kbd, useMantineTheme } from "@mantine/core";
import { useOs, useWindowScroll, useMediaQuery } from "@mantine/hooks";
import { spotlight } from "@mantine/spotlight";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function SearchButton() {
    const os = useOs();
    const shortcut = os === "macos" ? "⌘" : "Ctrl";
    const theme = useMantineTheme();
    const minimumMobileWidth = useMediaQuery(`(min-width: ${theme.breakpoints.xs})`);
    const collapseOnDesktopWidth = useMediaQuery(`(min-width: ${theme.breakpoints.md})`);
    const minimumDesktopWidth = useMediaQuery(`(min-width: ${theme.breakpoints.lg})`);

    const [scroll] = useWindowScroll();
    const collapsed = scroll.y > 5 || !minimumMobileWidth || (collapseOnDesktopWidth && !minimumDesktopWidth);

    return (
        <UnstyledButton size="xs" className={`search-button ${collapsed ? "collapsed" : ""}`} onClick={() => spotlight.open()}>
            <FontAwesomeIcon icon="search" size="xs" className="search-icon" />
            <div className="search-content">
                <Text size="xs" className="search-text">
                    Search...
                </Text>
                <Text size="xs" className="shortcut">
                    <Kbd size="xs">{shortcut}</Kbd> + <Kbd size="xs">K</Kbd>
                </Text>
            </div>
        </UnstyledButton>
    );
}
