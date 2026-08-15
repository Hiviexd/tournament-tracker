import { theme as mainTheme } from "./main";
import { deuteranopiaTheme, protanopiaTheme, tritanopiaTheme } from "./accessibility/colorblind";
import { ColorblindMode, DEFAULT_COLORBLIND_MODE } from "../constants";
import { getSavedPreference } from "../hooks/useLocalPreferences";
import { normalizeAlertColor, getThemeColor } from "./themeColorUtils";

export { normalizeAlertColor, getThemeColor };

/**
 * Get the appropriate theme based on colorblind mode setting
 */
export const getTheme = () => {
    const colorblindMode = getSavedPreference<ColorblindMode>("colorblindMode", DEFAULT_COLORBLIND_MODE);

    switch (colorblindMode) {
        case "deuteranopia":
            return deuteranopiaTheme;
        case "protanopia":
            return protanopiaTheme;
        case "tritanopia":
            return tritanopiaTheme;
        case "none":
        default:
            return mainTheme;
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
