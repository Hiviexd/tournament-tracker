/**
 * Theme color helpers (kept separate from `index.ts` / `shared.ts` to avoid circular imports).
 */

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
