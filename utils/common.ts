import moment from "moment";

/**
 * Shortens a string
 * @param string String to shorten
 * @param length Length of output string (defaults to `50`)
 */
export function shorten(string: string = "", length: number = 50): string {
    return string.length > length ? string.substring(0, length - 3) + "..." : string;
}

/**
 * Checks if a string is a valid whole number
 * @param str String to check
 */
export function isNumeric(str: string): boolean {
    return /^\d+$/.test(str);
}

/**
 * Checks if a link is an osu! forum topic link
 * @param link Link to check
 */
export function isOsuForumLink(link: string): boolean {
    return /^https:\/\/osu\.ppy\.sh\/community\/forums\/topics\/\d+(?:\?n=\d+)?$/.test(link);
}

/**
 * Checks if a link is an enchant ticket link
 * @param link Link to check
 */
export function isEnchantTicketLink(link: string): boolean {
    return /^https:\/\/osu\.enchant\.com\/spa\/inbox\/ticket\/[^/]+$/.test(link);
}

/**
 * Get the number of years from a number of days
 * @param days Number of days
 */
export function getYearsFromDays(days: number) {
    const duration = moment.duration(days, "days");
    return Math.floor(duration.asYears());
}

/**
 * Generate a badge command for committee members
 */
export function generateBadgeCommand(osuId: number, years: number, badgeValue: number, committee: string) {
    const description = `Longstanding contribution to the ${committee === "tc" ? "Tournament" : "Contest"} Committee`;
    const wikiLink = "https://osu.ppy.sh/wiki/en/People/Tournament_Committee";
    const durationString = years > 1 ? `${years} years` : "1 year";
    const replaceOption = badgeValue > 0 ? `--replace tcomm-${badgeValue}y.png` : "";

    const command = `.add-badge ${osuId} tcomm-${years}y.png "${description} - ${durationString}" ${wikiLink} ${replaceOption}`;

    return command.trim();
}

/**
 * Checks if a URL is valid
 * @param url URL to check
 */
export function isValidUrl(url: string): boolean {
    try {
        new URL(url);
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Appends a count to a word and pluralizes it if necessary
 * @param count Count of the word
 * @param word Word to append the count to
 */
export function countToWord(count: number, word: string) {
    return count === 1 ? `${count} ${word}` : `${count} ${word}s`;
}

/**
 * Formats a game mode string
 * @param mode Game mode to format
 * @returns Formatted game mode
 */
export function formatGameMode(mode: string) {
    switch (mode) {
        case "osu":
            return "osu!";
        case "taiko":
            return "osu!taiko";
        case "catch":
            return "osu!catch";
        case "mania":
            return "osu!mania";
        default:
            return mode;
    }
}

/**
 * Validates an email address
 * @param email Email address to validate
 * @returns `true` if the email is valid, `false` otherwise
 */
export function validateEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
