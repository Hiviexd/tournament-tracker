import { MantineTheme } from "@mantine/core";
import { theme as mainTheme } from "./main";
import { deuteranopiaTheme } from "./accessibility/deuteranopia";
import { protanopiaTheme } from "./accessibility/protanopia";
import { tritanopiaTheme } from "./accessibility/tritanopia";
import { ColorblindMode, DEFAULT_COLORBLIND_MODE } from "../constants";

/**
 * Get the appropriate theme based on colorblind mode setting
 */
export const getTheme = (): MantineTheme => {
    // Helper function to get JSON-parsed localStorage values
    const getLocalPreference = <T>(key: string, defaultValue: T): T => {
        try {
            const savedValue = localStorage.getItem(key);
            return savedValue ? JSON.parse(savedValue) : defaultValue;
        } catch (error) {
            console.error(`Error reading ${key} from localStorage:`, error);
            return defaultValue;
        }
    };

    const colorblindMode = getLocalPreference<ColorblindMode>("colorblindMode", DEFAULT_COLORBLIND_MODE);

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
