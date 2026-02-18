import { MantineTheme } from "@mantine/core";
import { theme as mainTheme } from "./main";
import { deuteranopiaTheme, protanopiaTheme, tritanopiaTheme } from "./accessibility/colorblind";
import { ColorblindMode, DEFAULT_COLORBLIND_MODE } from "../constants";
import { getSavedPreference } from "../hooks/useLocalPreferences";

/**
 * Get the appropriate theme based on colorblind mode setting
 */
export const getTheme = (): MantineTheme => {
    const colorblindMode = getSavedPreference<ColorblindMode>("colorblindMode", DEFAULT_COLORBLIND_MODE);

    switch (colorblindMode) {
        case "deuteranopia":
            return deuteranopiaTheme as MantineTheme;
        case "protanopia":
            return protanopiaTheme as MantineTheme;
        case "tritanopia":
            return tritanopiaTheme as MantineTheme;
        case "none":
        default:
            return mainTheme as MantineTheme;
    }
};

/**
 * Update theme and reload page
 */
export const updateTheme = (hue?: number, isGreyscale?: boolean, colorblindMode?: ColorblindMode) => {
    // Only save hue and greyscale for normal vision mode
    if (colorblindMode === "none" || !colorblindMode) {
        if (hue !== undefined) {
            localStorage.setItem("hue", JSON.stringify(hue));
        }
        if (isGreyscale !== undefined) {
            localStorage.setItem("greyscale", JSON.stringify(isGreyscale));
        }
    }

    // Always save colorblind mode
    if (colorblindMode !== undefined) {
        localStorage.setItem("colorblindMode", JSON.stringify(colorblindMode));
    }

    window.location.reload();
};

// Export the selected theme as default
export const theme = getTheme();

/**
 * Normalize Alert color to always use shade 6 when no shade is specified.
 * e.g. "warning" -> "warning.6", "blue" -> "blue.6". Leaves "blue.4" unchanged.
 */
export function normalizeAlertColor(color: string | undefined, primaryColor: string): string {
    if (color === undefined || color === null) return `${primaryColor}.6`;
    const s = String(color);
    return s.includes(".") ? s : `${s}.6`;
}

/**
 * Resolve Mantine color to a CSS color value from theme.
 * Handles "color", "color.shade" and undefined (primary).
 */
export function getThemeColor(
    theme: {
        colors: Record<string, string[]>;
        primaryColor: string;
        primaryShade?: number | { light: number; dark: number };
    },
    color: string | undefined,
): string | undefined {
    const name = typeof color === "string" && color.includes(".") ? color.split(".")[0] : (color ?? theme.primaryColor);
    const shade = typeof color === "string" && color.includes(".") ? parseInt(color.split(".")[1], 10) : 6;
    const scale = theme.colors[name];
    if (!scale || !Number.isInteger(shade)) return theme.colors[theme.primaryColor]?.[6];
    return scale[shade];
}
