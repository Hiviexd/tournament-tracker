import { createTheme } from "@mantine/core";
import { getAccessibleColorScheme } from "./colors";
import { baseThemeConfig, baseComponents } from "../shared";

const accessibleColors = getAccessibleColorScheme("tritanopia");

export const tritanopiaTheme = createTheme({
    ...baseThemeConfig,
    colors: {
        // Fixed primary color - no hue customization in colorblind themes
        primary: accessibleColors.red, // Use red as primary for tritanopia (blue is replaced)

        // Semantic colors
        danger: accessibleColors.danger,
        warning: accessibleColors.warning,
        success: accessibleColors.success,
        info: accessibleColors.info,

        // Override all standard Mantine colors with accessible alternatives
        red: accessibleColors.red,
        pink: accessibleColors.pink,
        grape: accessibleColors.grape,
        violet: accessibleColors.violet,
        indigo: accessibleColors.indigo,
        blue: accessibleColors.blue,
        cyan: accessibleColors.cyan,
        teal: accessibleColors.teal,
        green: accessibleColors.green,
        lime: accessibleColors.lime,
        yellow: accessibleColors.yellow,
        orange: accessibleColors.orange,
    },
    components: {
        ...baseComponents,
        // Override Anchor for colorblind themes to use info color
        Anchor: {
            styles: (theme) => ({
                root: {
                    color: theme.colors.info[4],
                    "&:hover": {
                        textDecoration: "underline",
                    },
                    "&.whiteLink": {
                        color: theme.white,
                    },
                },
            }),
        },
    },
});
