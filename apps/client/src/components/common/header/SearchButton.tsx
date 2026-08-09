import { UnstyledButton, Text, Kbd, useMantineTheme, type UnstyledButtonProps } from "@mantine/core";
import { useOs, useWindowScroll, useMediaQuery, useHover } from "@mantine/hooks";
import { spotlight } from "@mantine/spotlight";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

type SearchButtonProps = UnstyledButtonProps & {
    text?: string;
    isMobile?: boolean;
    onOpen?: () => void;
};

export default function SearchButton({ text, isMobile, onOpen, ...props }: SearchButtonProps) {
    const os = useOs();
    const shortcut = os === "macos" ? "⌘" : "Ctrl";

    const theme = useMantineTheme();
    const minimumMobileWidth = useMediaQuery(`(min-width: ${theme.breakpoints.xs})`);
    const collapseOnDesktopWidth = useMediaQuery(`(min-width: ${theme.breakpoints.md})`);
    const minimumDesktopWidth = useMediaQuery(`(min-width: ${theme.breakpoints.lg})`);

    const { hovered, ref } = useHover();
    const [scroll] = useWindowScroll();

    // Determine if we should force collapse because of desktop width
    const forceCollapseOnDesktop = collapseOnDesktopWidth && !minimumDesktopWidth;

    // Determine if scrolling or lack of minimum mobile width requires collapse
    const collapseDueToScrollOrMobile = scroll.y > 5 || !minimumMobileWidth;

    // Final collapsed state:
    // 1. Always collapsed if desktop width forces it
    // 2. Otherwise collapsed if not hovered, not on mobile, and scrolled / mobile conditions apply
    const collapsed = forceCollapseOnDesktop || (!hovered && !isMobile && collapseDueToScrollOrMobile);

    const handleOpen = () => {
        onOpen?.();
        spotlight.open();
    };

    return (
        <UnstyledButton
            size="xs"
            className={`search-button ${collapsed ? "collapsed" : ""}`}
            onClick={handleOpen}
            mod={{ mobile: isMobile }}
            ref={ref}
            {...props}>
            <FontAwesomeIcon icon="search" size="xs" className="search-icon" />
            <div className="search-content">
                <Text size="xs" className="search-text">
                    {text || "Search..."}
                </Text>
                <Text size="xs" className="shortcut">
                    <Kbd size="xs">{shortcut}</Kbd> + <Kbd size="xs">K</Kbd>
                </Text>
            </div>
        </UnstyledButton>
    );
}
