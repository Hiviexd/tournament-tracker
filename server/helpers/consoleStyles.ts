const stylesCodes = {
    // Colors
    cyan: "\x1b[36m",
    red: "\x1b[31m",
    orange: "\x1b[38;5;208m",
    yellow: "\x1b[33m",
    green: "\x1b[32m",
    magenta: "\x1b[35m",

    // Modifiers
    italic: "\x1b[3m",
    underline: "\x1b[4m",
    bold: "\x1b[1m",
    dim: "\x1b[2m",
    reset: "\x1b[0m",
} as const;

export type StyleName = keyof typeof stylesCodes;

/**
 * Applies multiple styles to text
 * @param text The text to style
 * @param styles Array of styles to apply
 * @example
 * styles("Hello World", ["cyan", "underline"])
 * styles("Error message", ["red", "italic"])
 */
export const styles = (text: string, styleNames: StyleName[]) => {
    const codes = styleNames.map((name) => {
        if (!(name in stylesCodes)) {
            throw new Error(`Invalid style name: ${name}`);
        }
        return stylesCodes[name];
    });

    return `${codes.join("")}${text}${stylesCodes.reset}`;
};
