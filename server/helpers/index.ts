import { IOsuAuthResponse } from "../../interfaces/OsuApi";
import moment from "moment";
import { Session } from "express-session";

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

type DiscordTimestampType = "relative" | "shortTime" | "longTime" | "shortDate" | "longDate" | "dateTime" | "dayDateTime";

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
        dayDateTime: "F"
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

export default {
    setSession,
    escapeUsername,
    defaultErrorMessage,
    shorten,
    discordTimestamp,
    isValidMongoId,
};
