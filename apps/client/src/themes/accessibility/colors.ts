import { MantineColorsTuple } from "@mantine/core";
import { generateColors } from "@mantine/colors-generator";

/**
 * Research-based accessible color palettes for colorblind users
 *
 * Based on:
 * - Coblis (Color Blindness Simulator) recommendations
 * - Paul Tol's colorblind-friendly palettes
 * - IBM Design Language accessibility guidelines
 * - Material Design accessibility standards
 */

// Deuteranopia & Protanopia (Red-Green colorblindness) - Most common
// Strategy: Use blue-yellow-purple spectrum, avoid red-green confusion
export const deuteranopiaColors = {
    // Semantic colors - carefully chosen to be distinguishable
    danger: "#D32F2F", // Dark red (still visible as dark to red-green colorblind)
    warning: "#FF9800", // Orange (appears as yellow-brown, distinct)
    success: "#1976D2", // Blue (replaces green, highly visible)
    info: "#7B1FA2", // Purple (distinct from all other colors)

    // Standard Mantine colors optimized for red-green colorblindness
    red: "#D32F2F", // Dark red
    pink: "#E91E63", // Pink (appears brownish but distinct)
    grape: "#9C27B0", // Purple
    violet: "#673AB7", // Violet
    indigo: "#3F51B5", // Indigo
    blue: "#2196F3", // Blue
    cyan: "#00BCD4", // Cyan
    teal: "#009688", // Teal (blue-green, safe)
    green: "#1976D2", // Blue (replacing green)
    lime: "#827717", // Dark yellow-green (appears brown)
    yellow: "#FF9800", // Orange (safe yellow alternative)
    orange: "#FF5722", // Orange-red
};

// Tritanopia (Blue-Yellow colorblindness) - Least common
// Strategy: Use red-green-purple spectrum, avoid blue-yellow confusion
export const tritanopiaColors = {
    // Semantic colors
    danger: "#D32F2F", // Red (highly visible)
    warning: "#D32F2F", // Red-orange (replaces yellow)
    success: "#388E3C", // Green (highly visible)
    info: "#7B1FA2", // Purple (replaces blue)

    // Standard Mantine colors optimized for blue-yellow colorblindness
    red: "#F44336", // Red
    pink: "#E91E63", // Pink
    grape: "#9C27B0", // Purple
    violet: "#673AB7", // Violet
    indigo: "#7B1FA2", // Purple (replacing indigo)
    blue: "#7B1FA2", // Purple (replacing blue)
    cyan: "#388E3C", // Green (replacing cyan)
    teal: "#2E7D32", // Dark green (replacing teal)
    green: "#4CAF50", // Green
    lime: "#8BC34A", // Lime green
    yellow: "#FF5722", // Orange-red (replacing yellow)
    orange: "#FF3D00", // Red-orange
};

// Protanopia (Red-blind) - Similar to deuteranopia but slightly different
// Strategy: Similar to deuteranopia but with slight adjustments for red-blindness
export const protanopiaColors = {
    // Semantic colors
    danger: "#D84315", // Dark orange-red (more visible than pure red)
    warning: "#FF9800", // Orange
    success: "#1565C0", // Dark blue (replaces green)
    info: "#6A1B9A", // Dark purple

    // Standard Mantine colors optimized for red-blindness
    red: "#D84315", // Dark orange-red
    pink: "#AD1457", // Dark pink (appears brownish)
    grape: "#7B1FA2", // Purple
    violet: "#512DA8", // Dark violet
    indigo: "#303F9F", // Dark indigo
    blue: "#1976D2", // Blue
    cyan: "#0097A7", // Dark cyan
    teal: "#00695C", // Dark teal
    green: "#1565C0", // Blue (replacing green)
    lime: "#689F38", // Olive (appears brownish)
    yellow: "#FFA000", // Amber (safe yellow)
    orange: "#E65100", // Dark orange
};

/**
 * Generate Mantine color tuples from base colors using generateColors
 * Adds extra dark colors at indices 10 and 11 to match main theme structure
 */
export const generateAccessibleColorTuple = (baseColor: string): MantineColorsTuple => {
    const colors = generateColors(baseColor) as unknown as string[];

    // Extract the base color's hue for consistent dark colors
    // For colorblind themes, we use fixed dark colors to maintain accessibility
    const dark = "#262626"; // dark background color (index 10)
    const darker = "#1a1a1a"; // darker background color (index 11)

    colors.push(dark);
    colors.push(darker);

    return colors as unknown as MantineColorsTuple;
};

/**
 * Generate complete accessible color schemes for each colorblind type
 */
export const getAccessibleColorScheme = (type: "deuteranopia" | "protanopia" | "tritanopia") => {
    const colorMap = {
        deuteranopia: deuteranopiaColors,
        protanopia: protanopiaColors,
        tritanopia: tritanopiaColors,
    };

    const colors = colorMap[type];

    return {
        // Semantic colors
        danger: generateAccessibleColorTuple(colors.danger),
        warning: generateAccessibleColorTuple(colors.warning),
        success: generateAccessibleColorTuple(colors.success),
        info: generateAccessibleColorTuple(colors.info),

        // Standard Mantine colors
        red: generateAccessibleColorTuple(colors.red),
        pink: generateAccessibleColorTuple(colors.pink),
        grape: generateAccessibleColorTuple(colors.grape),
        violet: generateAccessibleColorTuple(colors.violet),
        indigo: generateAccessibleColorTuple(colors.indigo),
        blue: generateAccessibleColorTuple(colors.blue),
        cyan: generateAccessibleColorTuple(colors.cyan),
        teal: generateAccessibleColorTuple(colors.teal),
        green: generateAccessibleColorTuple(colors.green),
        lime: generateAccessibleColorTuple(colors.lime),
        yellow: generateAccessibleColorTuple(colors.yellow),
        orange: generateAccessibleColorTuple(colors.orange),
    };
};
