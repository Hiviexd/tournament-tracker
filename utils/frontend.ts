import { IUser } from "../interfaces/User";
import {
    IVote,
    VoteType,
    ClassicVote,
    BinaryVote,
    VariableVote,
    BinaryStrictVote,
    RankedChoiceVote,
} from "../interfaces/Vote";
import { IVoting } from "../interfaces/Voting";
import { notifications } from "@mantine/notifications";
import axios from "axios";
import moment from "moment";

export interface ApiResponse<T = any> {
    data?: T;
    message?: string;
    error?: string;
    status?: number;
}

/**
 * Handle a mutation response and emit a notification
 * @param response The response from the mutation
 * @returns The data from the response
 */
export const handleMutationResponse = <T>(response: ApiResponse<T>): T => {
    const successMessage = response.message || "Action successful!";
    if (response.error) {
        notifications.show({
            title: response.status ? `Error (${response.status})` : "Error",
            message: response.error,
            color: "red",
        });
        throw new Error(response.error);
    }

    notifications.show({
        title: "Success",
        message: successMessage,
        color: "green",
    });

    return response.data || (response as unknown as T);
};

/**
 * Copy text to clipboard and emit a notification
 * @param text The text to copy
 */
export const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    notifications.show({
        title: "Success",
        message: "Copied to clipboard!",
        color: "green",
    });
};

/**
 * Check if the user has the required permissions to view a component
 * @param user The user object
 * @param permissions Array of permissions required to view the component
 */
export function hasRequiredPermissions(user: IUser | null, permissions: string[]): boolean {
    // No permissions required
    if (!permissions.length) return true;

    // No user, only allow if no permissions are required
    if (!user) return !permissions.length;

    // Admin/dev bypass
    if (user.isAdmin || user.isDev) return true;

    // Check if user has the required permissions
    if (
        (permissions.includes("admin") && !user.isAdmin) ||
        (permissions.includes("committee") && !user.isCommittee) ||
        (permissions.includes("dev") && !user.isDev)
    )
        return false;

    return true;
}

/**
 * Convert a hex color to HSL
 */
export function hexToHsl(hex: string): [number, number, number] {
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
export function hslToHex(h: number, s: number, l: number): string {
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

export function getInitialVoteData(voting: IVoting, userVote?: IVote): VoteType {
    if (userVote) {
        return userVote.data;
    }

    switch (voting.type) {
        case "classic":
            return { type: "classic", option: 0 } as ClassicVote;
        case "binary":
            return { type: "binary", score: 0 } as BinaryVote;
        case "binary-strict":
            // Default to neutral (0) if allowed, otherwise default to agree (1)
            return { type: "binary-strict", score: voting.allowNeutralVotes ? 0 : 1 } as BinaryStrictVote;
        case "variable":
            return {
                type: "variable",
                scores: voting.options.map((_, index) => ({
                    optionIndex: index,
                    score: 0,
                })),
            } as VariableVote;
        case "ranked-choice":
            return {
                type: "ranked-choice",
                scores: voting.options.map((_, index) => ({
                    optionIndex: index,
                    score: 0,
                })),
            } as RankedChoiceVote;
    }
}

/**
 * OutBounce easing function - replicates osu!stable's OutBounce easing
 * @param t Progress (0-1)
 * @returns Eased value
 * @see https://easings.net/#easeOutBounce
 */
export function easingOutBounce(t: number): number {
    const n1 = 7.5625;
    const d1 = 2.75;

    if (t < 1 / d1) {
        return n1 * t * t;
    } else if (t < 2 / d1) {
        return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
        return n1 * (t -= 2.25 / d1) * t + 0.9375;
    } else {
        return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
}

/**
 * OutCubic easing function - replicates osu!stable's OutCubic easing
 * @param t Progress (0-1)
 * @returns Eased value
 * @see https://easings.net/#easeOutCubic
 */
export function easingOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
}

/**
 * Handle an API error
 * @param error The error object
 * @returns The error object
 */
export const handleApiError = (error: any) => {
    return {
        error: error.response?.data?.error || error.response?.data?.message || error.message || "Unknown error",
        status: error.response?.status || 500,
        message: error.response?.data?.message,
    };
};

/**
 * Convert a date to a short relative format (e.g., "2d ago", "5h ago", "30s ago")
 * @param date The date to convert (can be Date, string, or moment object)
 * @param now Optional current date/time for comparison (defaults to current time)
 * @returns Short relative time string
 */
export function getShortRelativeTime(date: Date | string | moment.Moment, now?: Date | moment.Moment): string {
    const targetMoment = moment(date);
    const nowMoment = now ? moment(now) : moment();

    if (!targetMoment.isValid()) {
        return "invalid date";
    }

    const diffMs = nowMoment.diff(targetMoment);
    const isPast = diffMs > 0;
    const absDiffMs = Math.abs(diffMs);

    const seconds = Math.floor(absDiffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    // Determine the appropriate unit
    let timeUnit: string;
    if (years > 0) timeUnit = "years";
    else if (months > 0) timeUnit = "months";
    else if (days > 0) timeUnit = "days";
    else if (hours > 0) timeUnit = "hours";
    else if (minutes > 0) timeUnit = "minutes";
    else timeUnit = "seconds";

    let value: number;
    let unit: string;

    switch (timeUnit) {
        case "years":
            value = years;
            unit = "y";
            break;
        case "months":
            value = months;
            unit = "mo";
            break;
        case "days":
            value = days;
            unit = "d";
            break;
        case "hours":
            value = hours;
            unit = "h";
            break;
        case "minutes":
            value = minutes;
            unit = "m";
            break;
        case "seconds":
        default:
            value = Math.max(1, seconds); // Show at least "1s"
            unit = "s";
            break;
    }

    const suffix = isPast ? " ago" : " from now";
    return `${value}${unit}${suffix}`;
}

export type ApiCallParams = {
    method: "get" | "post" | "put" | "patch" | "delete";
    url: string;
    data?: any;
    params?: any;
    headers?: any;
    responseType?: string;
};

/**
 * API call handler
 * @example
 *   const result = await apiCall<IVoting[]>({ method: "get", url: "/api/votes" });
 *   // result is IVoting[] | ApiResponse<IVoting[]>
 */
export const apiCall = async <T = any>({
    method,
    url,
    data,
    params,
    headers,
    responseType,
}: ApiCallParams): Promise<T | ApiResponse<T> | any> => {
    try {
        const config: any = { headers };

        if (params) config.params = params;
        if (responseType) config.responseType = responseType;

        let response: any;

        if (method === "get" || method === "delete") {
            response = await axios[method](url, config);
        } else {
            response = await axios[method](url, data, config);
        }

        return responseType ? response : response.data;
    } catch (error: any) {
        return handleApiError(error);
    }
};
