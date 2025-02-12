import { IUser } from "@interfaces/User";

/**
 * Check if a http request is valid (doesn't contain an error)
 */
function httpIsValid(response) {
    return response && response.error === undefined;
}

/**
 * Check if the user has the required permissions to view a component
 * @param user The user object
 * @param permissions Array of permissions required to view the component
 */
function hasRequiredPermissions(user: IUser | null, permissions: string[]): boolean {
    // No permissions required
    if (!permissions.length) return true;

    // No user, only allow if no permissions are required
    if (!user) return !permissions.length;

    // Admin bypass
    if (user.isAdmin) return true;

    // Check if user has the required permissions
    if (
        (permissions.includes("admin") && !user.isAdmin) ||
        (permissions.includes("committee") && !user.isCommittee)
    )
        return false;

    return true;
}

/**
 * Convert a hex color to HSL
 */
function hexToHsl(hex: string): [number, number, number] {
    // Remove # if present
    hex = hex.replace("#", "");

    // Convert hex to RGB
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    // Find greatest and smallest channel values
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);

    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            case b:
                h = (r - g) / d + 4;
                break;
        }

        h /= 6;
    }

    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

/**
 * Convert HSL to a hex color
 * @param h Hue
 * @param s Saturation (between 0 and 1)
 * @param l Lightness (between 0 and 1)
 */
function hslToHex(h: number, s: number, l: number): string {
    h /= 360;

    let r, g, b;

    if (s === 0) {
        r = g = b = l;
    } else {
        const hue2rgb = (p: number, q: number, t: number) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;

        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }

    const toHex = (x: number) => {
        const hex = Math.round(x * 255).toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Checks if a link is an osu! forum topic link
 *
 * @param {string} link
 */
export function isOsuForumLink(link: string): boolean {
    return /^https:\/\/osu\.ppy\.sh\/community\/forums\/topics\/\d+(?:\?n=\d+)?$/.test(link);
}

export default {
    httpIsValid,
    hasRequiredPermissions,
    hexToHsl,
    hslToHex,
    isOsuForumLink,
};
