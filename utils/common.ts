import moment from "moment";
import { RankedChoiceVote, RankedChoiceVoteScore } from "../interfaces/Vote";

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
 * Extracts the osu! forum ID from a link
 * @param link Link to extract the ID from
 * @returns The osu! forum ID, or `null` if the link is not a valid osu! forum link
 */
export function extractOsuForumId(link: string): number | null {
    if (!isOsuForumLink(link)) return null;

    const match = link.match(/https:\/\/osu\.ppy\.sh\/community\/forums\/topics\/(\d+)/);
    return match ? parseInt(match[1]) : null;
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
export function formatCount(count: number, word: string) {
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
export function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Calculates the Schulze method winner ranking for ranked choice voting
 * @param votes Array of ranked choice votes
 * @param optionCount Number of options
 * @returns Array of option indices in ranking order (0 = winner, 1 = second place, etc.)
 */
export function calculateSchulzeWinner(votes: RankedChoiceVote[], optionCount: number): number[] {
    // Create preference matrix - d[i][j] is number of voters who prefer option i over option j
    const d: number[][] = Array(optionCount)
        .fill(null)
        .map(() => Array(optionCount).fill(0));

    votes.forEach((vote) => {
        for (let i = 0; i < optionCount; i++) {
            for (let j = 0; j < optionCount; j++) {
                if (i !== j) {
                    const scoreI = vote.scores.find((s: RankedChoiceVoteScore) => s.optionIndex === i)?.score ?? 0;
                    const scoreJ = vote.scores.find((s: RankedChoiceVoteScore) => s.optionIndex === j)?.score ?? 0;

                    if (scoreI > scoreJ) {
                        d[i][j]++;
                    }
                }
            }
        }
    });

    // Calculate strongest paths using Floyd-Warshall algorithm
    const p: number[][] = Array(optionCount)
        .fill(null)
        .map(() => Array(optionCount).fill(0));

    // Initialize strongest paths
    for (let i = 0; i < optionCount; i++) {
        for (let j = 0; j < optionCount; j++) {
            if (i !== j) {
                p[i][j] = d[i][j] > d[j][i] ? d[i][j] : 0;
            }
        }
    }

    // Find strongest paths
    for (let k = 0; k < optionCount; k++) {
        for (let i = 0; i < optionCount; i++) {
            for (let j = 0; j < optionCount; j++) {
                if (i !== j && i !== k && j !== k) {
                    p[i][j] = Math.max(p[i][j], Math.min(p[i][k], p[k][j]));
                }
            }
        }
    }

    // Determine ranking based on strongest paths
    const ranking: Array<{ index: number; wins: number }> = [];
    for (let i = 0; i < optionCount; i++) {
        let wins = 0;
        for (let j = 0; j < optionCount; j++) {
            if (i !== j && p[i][j] > p[j][i]) {
                wins++;
            }
        }
        ranking.push({ index: i, wins });
    }

    // Sort by number of wins (descending)
    ranking.sort((a, b) => b.wins - a.wins);

    return ranking.map((r) => r.index);
}
