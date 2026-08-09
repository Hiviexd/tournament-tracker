import { createTheme } from "@mantine/core";
import { getAccessibleColorScheme } from "./colors";
import { baseThemeConfig, baseComponents } from "../shared";
import { ColorblindMode } from "../../constants";

/**
 * Create a colorblind-accessible theme for the specified type
 */
export const createColorblindTheme = (type: Exclude<ColorblindMode, "none">) => {
    const accessibleColors = getAccessibleColorScheme(type);

    // Tritanopia uses pink as primary (blue-yellow colorblind)
    // Deuteranopia & Protanopia use blue as primary (red-green colorblind)
    const primaryColor = type === "tritanopia" ? accessibleColors.pink : accessibleColors.blue;

    return createTheme({
        ...baseThemeConfig,
        colors: {
            // Fixed primary color - no hue customization in colorblind themes
            primary: primaryColor,

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
};

export const deuteranopiaTheme = createColorblindTheme("deuteranopia");
export const protanopiaTheme = createColorblindTheme("protanopia");
export const tritanopiaTheme = createColorblindTheme("tritanopia");
