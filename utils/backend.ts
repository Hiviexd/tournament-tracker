import { IOsuAuthResponse, IBeatmapWithNotes } from "../interfaces/OsuApi";
import { IValidationResult } from "../interfaces/ComplianceApi";
import { IDiscordField } from "../interfaces/Discord";
import { IAttachment } from "../interfaces/Attachment";
import moment from "moment";
import crypto from "crypto";

/**
 * Sets the session with the oauth response
 * @param session The session object
 * @param response The oauth response
 */
export function setSession(session, response: IOsuAuthResponse) {
    // set the cookie's maxAge to 7 days
    session.cookie.maxAge = moment.duration(7, "days").asMilliseconds();

    // *1000 because maxAge is miliseconds, oauth is seconds
    session.expireDate = Date.now() + response.expires_in * 1000;
    session.accessToken = response.access_token;
    session.refreshToken = response.refresh_token;
}

/**
 * Escapes special characters in usernames to prevent them from being interpreted as syntax
 * Specifically escapes parentheses () and square brackets [] by adding backslashes before them
 * Also trims leading and trailing whitespace
 * @param username The username string to sanitize
 * @returns The escaped username safe for use in regex, markdown, or other contexts where these characters have special meaning
 */
export function escapeUsername(username: string) {
    username = username.trim();
    return username.replace(/[()[\]]/g, "\\$&");
}

export const defaultErrorMessage = { error: "Something went wrong!" };

type DiscordTimestampType =
    | "relative"
    | "shortTime"
    | "longTime"
    | "shortDate"
    | "longDate"
    | "dateTime"
    | "dayDateTime";

/**
 * Creates a dynamic Discord timestamp
 * @param date Date to convert
 * @param type Type of timestamp (defaults to `relative`)
 * @example
 * discordTimestamp(new Date(), "relative") // "7 days ago"
 * discordTimestamp(new Date(), "shortTime") // "12:00"
 * discordTimestamp(new Date(), "longTime") // "12:00:00"
 * discordTimestamp(new Date(), "shortDate") // "05/26/2025"
 * discordTimestamp(new Date(), "longDate") // "May 26, 2025"
 * discordTimestamp(new Date(), "dateTime") // "May 26, 2025 12:00"
 * discordTimestamp(new Date(), "dayDateTime") // "Monday, May 26, 2025 12:00"
 */
export function discordTimestamp(date: Date, type: DiscordTimestampType = "relative"): string {
    const types: Record<DiscordTimestampType, string> = {
        relative: "R",
        shortTime: "t",
        longTime: "T",
        shortDate: "d",
        longDate: "D",
        dateTime: "f",
        dayDateTime: "F",
    };
    return `<t:${Math.floor(date.getTime() / 1000)}:${types[type]}>`;
}

/**
 * Validates a MongoDB ObjectId
 * @param id ID to validate
 */
export function isValidMongoId(id: string): boolean {
    return /^[0-9a-fA-F]{24}$/.test(id);
}

/**
 * Truncates a filename to a certain length
 * @param filename Filename to truncate
 * @param maxLength Maximum length of the filename (defaults to `30`)
 */
export function truncateFilename(filename: string, maxLength: number = 30): string {
    if (filename.length <= maxLength) return filename;

    const extension = filename.includes(".") ? filename.split(".").pop()! : "";
    const nameWithoutExt = filename.substring(0, filename.lastIndexOf("."));
    const truncatedName = nameWithoutExt.substring(0, maxLength - extension.length - 3);

    return `${truncatedName}[...]${extension ? "." + extension : ""}`;
}

/**
 * Returns a Discord field for attachments
 * @param attachments Attachments to display
 * @returns Discord field or `null` if no attachments
 */
export function getAttachmentsField(attachments: IAttachment[]): IDiscordField | null {
    if (!attachments?.length) return null;

    const attachmentsList = attachments
        .map((att) => `• [${truncateFilename(att.originalName)}](${new URL(att.url).href})`)
        .join("\n");

    return {
        name: "Attachments",
        value: attachmentsList,
    };
}

/**
 * Validates an osu! profile link
 * @param input The input string to validate
 * @returns The username if valid, otherwise `null`
 */
export function validateOsuProfileLink(input: string): string | null {
    const urlPattern = /^(?:https?:\/\/)?osu\.ppy\.sh\/users\/([\w\-[\]]+)\/?$/i;

    const urlMatch = input.match(urlPattern);

    if (urlMatch) {
        const value = urlMatch[1];
        return value;
    }

    return null;
}

/** * Delay execution for specified milliseconds */
export const delay = (ms: number): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Sanitizes user input string into a set of beatmap IDs
 * @param input The input string to sanitize
 * @returns A set of beatmap IDs
 */
export function sanitizeBeatmapInput(input: string): Set<number> {
    const ids = new Set<number>();

    // Remove mode-specific tags
    const cleanInput = input.replace(/#(?:osu|taiko|fruits|mania)/g, "");

    // Split by any combination of delimiters (newlines, commas, spaces, tabs)
    const parts = cleanInput.split(/[\n,\s\t]+/).filter((part) => part.length > 0);

    for (const part of parts) {
        try {
            // Extract ID from URL or use the part directly
            let processedPart = part;
            if (part.includes("/")) {
                processedPart = part.split("/").pop() || "";
            }

            const id = parseInt(processedPart);
            if (!isNaN(id)) {
                ids.add(id);
            }
        } catch {
            // Skip invalid parts instead of returning empty set
            continue;
        }
    }

    return ids;
}

/**
 * Sorts beatmaps by their status, then by artist within each status
 * * Order: graveyard -> wip -> pending -> loved -> approved -> qualified -> ranked
 * * Within each status: alphabetical by artist
 * @param beatmaps Beatmaps to sort
 * @returns Sorted beatmaps
 */
export function sortBeatmapsByStatus<T extends IBeatmapWithNotes | IValidationResult>(beatmaps: T[]) {
    const statusOrder = ["graveyard", "wip", "pending", "loved", "approved", "qualified", "ranked"];
    return beatmaps.sort((a, b) => {
        // Extract status and artist based on the type
        const statusA = "beatmapset" in a ? a.beatmapset.status : a.status;
        const statusB = "beatmapset" in b ? b.beatmapset.status : b.status;
        const artistA = "beatmapset" in a ? a.beatmapset.artist : a.artist;
        const artistB = "beatmapset" in b ? b.beatmapset.artist : b.artist;

        // First, sort by status
        const statusDiff = statusOrder.indexOf(statusA) - statusOrder.indexOf(statusB);
        if (statusDiff !== 0) {
            return statusDiff;
        }

        // If statuses are the same, sort by artist
        return artistA.localeCompare(artistB);
    });
}

/**
 * Sets a date to noon (12:00:00)
 * @param date Date to set to noon
 * @returns Date set to noon
 */
export function setDateToNoon(date: string | Date): Date {
    const d = new Date(date);
    d.setHours(12, 0, 0, 0);
    return d;
}

/**
 * Console styles
 */

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
 * consoleStyles("Hello World", ["cyan", "underline"])
 * consoleStyles("Error message", ["red", "italic"])
 */
export const consoleStyles = (text: string, styleNames: StyleName[]) => {
    const codes = styleNames.map((name) => {
        if (!(name in stylesCodes)) {
            throw new Error(`Invalid style name: ${name}`);
        }
        return stylesCodes[name];
    });

    return `${codes.join("")}${text}${stylesCodes.reset}`;
};

/**
 * Sanitizes a filename for safe use in HTTP Content-Disposition headers
 * Replaces unsafe characters with safe alternatives and provides both ASCII and UTF-8 encoded versions
 * @param filename The filename to sanitize
 * @returns Object with sanitized ASCII filename and properly encoded UTF-8 version
 */
export function sanitizeFilename(filename: string): { ascii: string; encoded: string } {
    const trimmed = filename.trim();

    // ASCII-safe fallback: only letters, numbers, -, _, .
    const ascii = trimmed.replace(/[^a-zA-Z0-9-_.]+/g, "_");

    // RFC 5987 encoded UTF-8 version for headers
    const encoded = `UTF-8''${encodeURIComponent(trimmed)}`;

    return { ascii, encoded };
}

/**
 * Generates a raw and hashed API key
 * @param rawKeyOverride Optional raw key to use instead of generating a new one
 * @returns The raw and hashed API key
 * @example
 * generateApiKey("1234567890") // { raw: "1234567890", hashed: "84d898...<sha256 hash>..." }
 * generateApiKey() // { raw: "randomBase64urlString", hashed: "sha256 hash of it" }
 */
export function generateApiKey(rawKeyOverride?: string): { raw: string; hashed: string } {
    // 32 bytes random -> base64url
    const raw = rawKeyOverride || crypto.randomBytes(32).toString("base64url");
    const hashed = crypto.createHash("sha256").update(raw).digest("hex");
    return { raw, hashed };
}

/**
 * Splits a search content into an array of search terms by spaces
 * @param searchContent The search content to split
 * @returns An array of search terms
 */
export function splitSearchTerms(searchContent: string): string[] {
    return searchContent
        .trim()
        .split(/\s+/)
        .filter((term) => term.length > 0);
}
