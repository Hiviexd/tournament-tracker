import { MantineThemeComponents } from "@mantine/core";
import { normalizeAlertColor, getThemeColor } from "./themeColorUtils";

/**
 * Base theme configuration shared across all themes
 */
export const baseThemeConfig = {
    fontFamily: "Nunito, sans-serif",
    shadows: {
        md: "1px 1px 3px rgba(0, 0, 0, .25)",
        xl: "5px 5px 3px rgba(0, 0, 0, .25)",
    },
    primaryColor: "primary" as const,
    white: "#f8f9fa",
    black: "#212529",
    defaultRadius: "sm",
};

/**
 * Shared component configurations
 */
export const baseComponents: MantineThemeComponents = {
    Alert: {
        vars: (theme: any, props: { color?: string; variant?: string; autoContrast?: boolean }) => {
            const normalizedColor = normalizeAlertColor(props?.color, theme.primaryColor);
            const colors = theme.variantColorResolver({
                color: normalizedColor,
                theme,
                variant: props?.variant ?? "light",
                autoContrast: props?.autoContrast,
            });
            return {
                root: {
                    "--alert-color": colors.color,
                },
            };
        },
        styles: (theme, props) => {
            const borderColor = getThemeColor(theme, props?.color as string | undefined);
            return {
                root: borderColor ? { borderColor } : {},
            };
        },
    },
    ActionIcon: {
        styles: {
            root: {
                transition: "all 0.2s ease",
                "&:hover": {
                    transform: "translateY(-2px)",
                },
            },
        },
    },
    Anchor: {
        styles: (theme) => ({
            root: {
                color: theme.colors.primary[3],
                "&:hover": {
                    textDecoration: "underline",
                },
                "&.whiteLink": {
                    color: theme.white,
                },
            },
        }),
    },
    Button: {
        styles: {
            root: {
                transition: "all 0.2s ease",
                "&:hover": {
                    transform: "translateY(-2px)",
                },
            },
        },
    },
    Card: {
        defaultProps: {
            bg: "primary.11",
        },
        styles: {
            root: {
                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
            },
        },
    },
    HoverCard: {
        styles: {
            dropdown: {
                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
            },
        },
    },
    Notification: {
        styles: {
            root: {
                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
            },
        },
    },
    Popover: {
        styles: {
            dropdown: {
                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
            },
        },
    },
    SegmentedControl: {
        styles: {
            root: {
                backgroundColor: "var(--mantine-color-primary-10)",
            },
        },
    },
    Select: {
        defaultProps: {
            withScrollArea: false,
            comboboxProps: { transitionProps: { transition: "fade", duration: 150 } },
        },
        styles: {
            dropdown: {
                maxHeight: 200,
                overflowY: "auto",
            },
        },
    },
    Tabs: {
        defaultProps: {
            color: "primary.6",
        },
    },
    TagsInput: {
        styles: {
            pill: {
                backgroundColor: "var(--mantine-color-primary-light)",
                color: "var(--mantine-color-primary-light-color)",
            },
        },
    },
    Tooltip: {
        defaultProps: {
            withArrow: true,
            color: "primary.11",
            arrowSize: 8,
            events: { hover: true, focus: true, touch: true },
        },
        styles: {
            tooltip: {
                border: "1px solid var(--mantine-color-primary-6)",
                boxShadow: "0 4px 4px rgba(0, 0, 0, 0.1)",
                filter: "drop-shadow(0 2px 2px rgba(0, 0, 0, 0.1))",
            },
            arrow: {
                border: "1px solid var(--mantine-color-primary-6)",
                filter: "drop-shadow(0 1px 1px rgba(0, 0, 0, 0.1))",
            },
        },
    },
};

/**
 * Special Anchor styles for the main theme (handles greyscale mode)
 */
export const getMainThemeAnchorStyles = (isGreyscale: boolean) => ({
    Anchor: {
        styles: (theme: any) => ({
            root: {
                color: isGreyscale ? theme.colors.info[4] : theme.colors.primary[3],
                "&:hover": {
                    textDecoration: "underline",
                },
                "&.whiteLink": {
                    color: theme.white,
                },
            },
        }),
    },
});
