import { IOsuAuthResponse } from "../../interfaces/OsuApi";
import moment from "moment";
import { Session } from "express-session";
import { IDiscordField } from "../../interfaces/Discord";
import { IAttachment } from "../../interfaces/Attachment";

function setSession(session: Session, response: IOsuAuthResponse) {
    // set the cookie's maxAge to 7 days
    session.cookie.maxAge = moment.duration(7, "days").asMilliseconds();

    // *1000 because maxAge is miliseconds, oauth is seconds
    session.expireDate = Date.now() + response.expires_in * 1000;
    session.accessToken = response.access_token;
    session.refreshToken = response.refresh_token;
}

/** Just replaces () and [] */
function escapeUsername(username: string) {
    username = username.trim();

    return username.replace(/[()[\]]/g, "\\$&");
}

const defaultErrorMessage = { error: "Something went wrong!" };

/**
 * * Shortens a string
 * @param string String to shorten
 * @param length Length of output string (defaults to `50`)
 */
function shorten(string: string = "", length: number = 50): string {
    return string.length > length ? string.substring(0, length - 3) + "..." : string;
}

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
 */
function discordTimestamp(date: Date, type: DiscordTimestampType = "relative"): string {
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
function isValidMongoId(id: string): boolean {
    return /^[0-9a-fA-F]{24}$/.test(id);
}

/**
 * Checks if a string is a valid whole number
 * @param str String to check
 */
function isNumeric(str: string): boolean {
    return /^\d+$/.test(str);
}

/**
 * Checks if a link is an osu! forum topic link
 *
 * @param {string} link
 */
function isOsuForumLink(link: string): boolean {
    return /^https:\/\/osu\.ppy\.sh\/community\/forums\/topics\/\d+(?:\?n=\d+)?$/.test(link);
}

/**
 * Truncates a filename to a certain length
 * @param filename Filename to truncate
 * @param maxLength Maximum length of the filename (defaults to `30`)
 */
function truncateFilename(filename: string, maxLength: number = 30): string {
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
function getAttachmentsField(attachments: IAttachment[]): IDiscordField | null {
    if (!attachments?.length) return null;

    const attachmentsList = attachments
        .map((att) => `• [${truncateFilename(att.originalName)}](${new URL(att.url).href})`)
        .join("\n");

    return {
        name: "Attachments",
        value: attachmentsList,
    };
}

function validateOsuProfileLink(input: string): string | null {
    const urlPattern = /^(?:https?:\/\/)?osu\.ppy\.sh\/users\/([\w\-[\]]+)\/?$/i;

    const urlMatch = input.match(urlPattern);

    if (urlMatch) {
        const value = urlMatch[1];
        return value;
    }

    return null;
}

export default {
    setSession,
    escapeUsername,
    defaultErrorMessage,
    shorten,
    discordTimestamp,
    isValidMongoId,
    isNumeric,
    isOsuForumLink,
    truncateFilename,
    getAttachmentsField,
    validateOsuProfileLink,
};
