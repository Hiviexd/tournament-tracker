import { RankedChoiceVote, RankedChoiceVoteScore } from "@tc/types/Vote";
import { IUser, UserGroup } from "@tc/types/User";
import { IInfringement, TIME_BASED_TYPES } from "@tc/types/Infringement";
import type { ExtraLinkType, ITournamentExtraLink } from "@tc/types/Tournament";

function typeTag<T>(value: T): string {
    return Object.prototype.toString.call(value);
}

export function isString<T>(value: T): value is T & string {
    return typeTag(value) === "[object String]";
}

export function isNumber<T>(value: T): value is T & number {
    return typeTag(value) === "[object Number]" && value === value;
}

export function isBoolean<T>(value: T): value is T & boolean {
    return typeTag(value) === "[object Boolean]";
}

export function isPlainObject<T>(
    value: T,
): value is object & Exclude<T, string | number | boolean | bigint | symbol | null | undefined> {
    return typeTag(value) === "[object Object]";
}

export function isFunction<T>(value: T): value is T & ((...args: never[]) => void) {
    const tag = typeTag(value);
    return tag === "[object Function]" || tag === "[object AsyncFunction]";
}

export function pickStringUnion<T extends string>(value: string, allowed: readonly T[]): T | undefined {
    for (const item of allowed) {
        if (item === value) return item;
    }
    return undefined;
}

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
 * Checks if a string is only Latin script (no Cyrillic, Chinese, etc.)
 * @param input String to check
 */
export function isLatinScriptOnly(input: string): boolean {
    return /^[\p{Script=Latin}\p{N}\p{P}\p{S}\s]*$/u.test(input);
}

/**
 * Checks if a link is an osu! forum topic link
 * @param link Link to check
 */
export function isOsuForumLink(link: string): boolean {
    return /^https:\/\/osu\.ppy\.sh\/community\/forums\/topics\/\d+(?:\?.*)?$/.test(link);
}

/**
 * Checks if a link is an osu! news link
 * @param link Link to check
 */
export function isOsuNewsLink(link: string): boolean {
    return /^https:\/\/osu\.ppy\.sh\/home\/news\/[\w-]+(?:\?.*)?$/.test(link);
}

/**
 * Checks if a link is an osu! wiki page link
 * @param link Link to check
 */
export function isOsuWikiLink(link: string): boolean {
    return /^https:\/\/osu\.ppy\.sh\/wiki\/.+(?:\?.*)?$/.test(link);
}

/**
 * Checks if a link is a Challonge link
 * @param link Link to check
 */
export function isChallongeLink(link: string): boolean {
    return /^https:\/\/([a-z0-9-]+\.)?challonge\.com\/.+/.test(link);
}

/**
 * Checks if a link is a Twitch link
 * @param link Link to check
 */
export function isTwitchLink(link: string): boolean {
    return /^https:\/\/(www\.)?twitch\.tv\/[\w-]+(?:\/[\w-]+)*(?:\?.*)?$/.test(link);
}

/**
 * Checks if a link is a Google Docs link
 * @param link Link to check
 */
export function isGoogleDocsLink(link: string): boolean {
    return /^https:\/\/docs\.google\.com\/.+/.test(link);
}

/**
 * Checks if a link is a Mappers' Guild link
 * @param link Link to check
 */
export function isMappersGuildLink(link: string): boolean {
    return /^https:\/\/([a-z0-9-]+\.)?mappersguild\.com\/.+/.test(link);
}

/**
 * Checks if a link is an osu! contest listing link
 * @param link Link to check
 */
export function isOsuContestLink(link: string): boolean {
    return /^https:\/\/osu\.ppy\.sh\/community\/contests(?:\/\d+)?(?:\?.*)?$/.test(link);
}

/**
 * Checks if a link is a Discord invite or channel link
 * @param link Link to check
 */
export function isDiscordLink(link: string): boolean {
    return (
        /^https:\/\/discord\.com\/channels\/\d+\/\d+(?:\/\d+)?(?:\?.*)?$/.test(link) ||
        /^https:\/\/discord\.gg\/[\w-]+(?:\?.*)?$/.test(link) ||
        /^https:\/\/discord\.com\/invite\/[\w-]+(?:\?.*)?$/.test(link)
    );
}

export const EXTRA_LINK_TYPES: ExtraLinkType[] = [
    "news",
    "wiki",
    "challonge",
    "sheet",
    "website",
    "mappersguild",
    "contest",
    "discord",
    "twitch",
];

export const EXTRA_LINK_DEFAULTS = {
    news: "News Post",
    wiki: "Wiki Page",
    challonge: "Challonge",
    sheet: "Main Sheet",
    website: "Website",
    mappersguild: "Mapper's Guild",
    contest: "Contest Listing",
    discord: "Discord",
    twitch: "Twitch",
} satisfies Record<ExtraLinkType, string>;

/**
 * Checks if a URL is valid for the given extra link type
 */
export function isExtraLinkUrlValid(type: ExtraLinkType, url: string): boolean {
    switch (type) {
        case "news":
            return isOsuNewsLink(url);
        case "wiki":
            return isOsuWikiLink(url);
        case "challonge":
            return isChallongeLink(url);
        case "sheet":
            return isGoogleDocsLink(url);
        case "website":
            return isValidUrl(url);
        case "mappersguild":
            return isMappersGuildLink(url);
        case "contest":
            return isOsuContestLink(url);
        case "discord":
            return isDiscordLink(url);
        case "twitch":
            return isTwitchLink(url);
        default:
            return false;
    }
}

/**
 * Validate a single extra link entry
 * @returns Error message or null if valid
 */
export function validateExtraLink(link: ITournamentExtraLink): string | null {
    if (!link.type || !EXTRA_LINK_TYPES.includes(link.type)) return "Invalid link type";
    if (!link.name?.trim()) return "Link name is required";
    if (!link.url?.trim()) return "Link URL is required";
    if (!isExtraLinkUrlValid(link.type, link.url.trim())) {
        return `Invalid ${EXTRA_LINK_DEFAULTS[link.type]} URL`;
    }
    return null;
}

/**
 * Validate an array of extra links
 * @returns Error message or null if valid
 */
export function validateExtraLinks(links: ITournamentExtraLink[]): string | null {
    if (!Array.isArray(links)) return "Extra links must be an array";
    for (const link of links) {
        const error = validateExtraLink(link);
        if (error) return error;
    }
    return null;
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
 * Builds a canonical Enchant ticket URL from a ticket id
 * @param ticketId Enchant ticket id
 */
export function buildEnchantTicketUrl(ticketId: string): string {
    return `https://osu.enchant.com/spa/inbox/ticket/${ticketId}`;
}

/**
 * Escapes text for safe HTML interpolation (basic entity encoding)
 * @param value Text to escape
 */
export function escapeHtml(value: string): string {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

/**
 * Get the number of full years from a number of days (365 days = 1 year).
 * Uses fixed 365-day years so that e.g. 730 days = 2 years for badge eligibility.
 * @param days Number of days
 */
export function getYearsFromDays(days: number) {
    return Math.floor(days / 365);
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
 * Options for {@link isValidUrl}.
 */
export interface IsValidUrlOptions {
    /** Allowed protocols (e.g. `["https", "blob"]`). Defaults to `["https"]` when omitted. */
    allowedProtocols?: string[];
}

/**
 * Checks if a URL is valid and uses an allowed protocol (default: https only).
 * @param url URL to check
 * @param options Optional settings; use `allowedProtocols` to allow e.g. `blob:` URLs.
 */
export function isValidUrl(url: string, options: IsValidUrlOptions = {}): boolean {
    try {
        const parsed = new URL(url);
        const allowed = options.allowedProtocols ?? ["https"];
        const normalized = allowed.map((p) => (p.endsWith(":") ? p : `${p}:`));
        return normalized.includes(parsed.protocol);
    } catch {
        return false;
    }
}

/** Named CSS colors that are safe for inline style (e.g. from osu! API). */
const SAFE_CSS_NAMED_COLORS = new Set([
    "transparent",
    "currentColor",
    "inherit",
    "initial",
    "unset",
    "black",
    "white",
    "red",
    "green",
    "blue",
    "yellow",
    "orange",
    "purple",
    "pink",
    "gray",
    "grey",
]);

/**
 * Returns a CSS color value safe for use in inline style (e.g. color: ...).
 * Allows hex (#RGB, #RRGGBB, #RGBA, #RRGGBBAA) and a small allowlist of named colors.
 * Returns undefined for invalid or potentially injectable input.
 * @param value Raw color value (e.g. from API)
 */
export function sanitizeCssColor(value: string | null | undefined): string | undefined {
    if (value == null) return undefined;
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    // Hex: 3, 4, 6, or 8 hex digits
    if (/^#[\da-fA-F]{3,8}$/.test(trimmed)) return trimmed;
    // Named color (lowercase match)
    if (SAFE_CSS_NAMED_COLORS.has(trimmed.toLowerCase())) return trimmed;
    return undefined;
}

/**
 * Pluralizes a word based on count, optionally prefixing the count
 * @param count Count of the word
 * @param word Word to pluralize
 * @param options.includeCount Whether to include the count in the result (default: true)
 */
export function formatCount(count: number, word: string, options: { includeCount?: boolean } = {}) {
    const { includeCount = true } = options;
    const label = count === 1 ? word : pluralize(word);
    return includeCount ? `${count} ${label}` : label;
}

function pluralize(word: string): string {
    if (/[aeiou]y$/i.test(word)) return `${word}s`;
    if (/y$/i.test(word)) return `${word.slice(0, -1)}ies`;
    return `${word}s`;
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

export interface SchulzeResult {
    ranking: number[];
    isFirstPlaceTie: boolean;
}

/**
 * Calculates the Schulze method ranking and whether first place is tied
 */
export function getSchulzeResult(votes: RankedChoiceVote[], optionCount: number): SchulzeResult {
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

    return {
        ranking: ranking.map((r) => r.index),
        isFirstPlaceTie: ranking.length > 1 && ranking[0].wins === ranking[1].wins,
    };
}

/**
 * Calculates the Schulze method winner ranking for ranked choice voting
 * @param votes Array of ranked choice votes
 * @param optionCount Number of options
 * @returns Array of option indices in ranking order (0 = winner, 1 = second place, etc.)
 */
export function calculateSchulzeWinner(votes: RankedChoiceVote[], optionCount: number): number[] {
    return getSchulzeResult(votes, optionCount).ranking;
}

/**
 * Returns the available global search types based on the user's permissions
 * @param params The parameters for the search types
 * @param params.user The user to check permissions for
 * @param params.searchType The type of filters to return (frontend | backend | all)
 * @returns The available global search types
 */
export function getSearchTypes({
    user = null,
    searchType = "backend",
}: {
    user?: IUser | null;
    searchType?: "frontend" | "backend" | "all";
}) {
    const BASE_SEARCH_TYPES = {
        tournament: ["tournament", "tournaments", "t"],
        voting: ["voting", "votings", "vote", "votes", "v"],
        ticket: ["ticket", "tickets", "tk"],
        resource: ["resource", "resources", "rs"],
    };

    const FRONTEND_SEARCH_TYPES = {
        page: ["page", "pages", "p"],
    };

    const PRIVATE_SEARCH_TYPES = {
        report: ["report", "reports", "r"],
        article: ["article", "articles", "doc", "docs", "d"],
    };

    if (searchType === "frontend") return FRONTEND_SEARCH_TYPES;
    if (searchType === "backend") {
        if (user?.isCommitteeOrAdmin) return { ...BASE_SEARCH_TYPES, ...PRIVATE_SEARCH_TYPES };
        return BASE_SEARCH_TYPES;
    }
    if (searchType === "all") {
        if (user?.isCommitteeOrAdmin) {
            return { ...FRONTEND_SEARCH_TYPES, ...BASE_SEARCH_TYPES, ...PRIVATE_SEARCH_TYPES };
        }
        return { ...FRONTEND_SEARCH_TYPES, ...BASE_SEARCH_TYPES };
    }

    return BASE_SEARCH_TYPES;
}

/**
 * Parse search query to extract type and content
 * @param query The search query string
 * @param searchTypes The available search types mapping (frontend: page only, backend: all types)
 * @returns Object with searchType and searchContent
 */
type ParsedSearchQuery = { searchType: string | null; searchContent: string };
type SearchTypeAliases = { readonly [type: string]: readonly string[] };

export function parseSearchQuery(query: string, searchTypes: SearchTypeAliases): ParsedSearchQuery {
    const typePrefixMatch = query.match(/^(\w+):(.+)$/);

    let result: ParsedSearchQuery = {
        searchType: null,
        searchContent: query,
    };

    if (typePrefixMatch) {
        const [, type, content] = typePrefixMatch;
        const normalizedType = type.toLowerCase();

        const searchAliasMap = Object.fromEntries(
            Object.entries(searchTypes).flatMap(([canonical, aliases]) => aliases.map((alias) => [alias, canonical])),
        );

        const canonicalType = searchAliasMap[normalizedType];
        if (canonicalType) {
            result = {
                searchType: canonicalType,
                searchContent: content.trim(),
            };
        }
    }

    return result;
}

function isInfringementTimeBased(infringement: IInfringement): boolean {
    return infringement.isTimeBased ?? TIME_BASED_TYPES.includes(infringement.type);
}

function isInfringementIndefinite(infringement: IInfringement): boolean {
    return infringement.isIndefinite ?? !!(infringement.startDate && !infringement.endDate);
}

function isInfringementExpired(infringement: IInfringement): boolean {
    return infringement.isExpired ?? !!(infringement.endDate && new Date(infringement.endDate) < new Date());
}

/**
 * Whether a user currently counts toward a vote's required-votes roster
 * (active voter in at least one of the vote's assigned groups).
 */
export function isEligibleVoter(
    user: Pick<IUser, "isActiveVoter" | "groups"> | null | undefined,
    assignedGroups: UserGroup[],
): boolean {
    if (!user?.isActiveVoter || !assignedGroups?.length) return false;
    return user.groups.some((group) => assignedGroups.includes(group));
}

/**
 * Resolves the user's active infringement (matches the User model virtual).
 * Uses `activeInfringement` when present; otherwise derives from a populated `infringements` array.
 */
export function getActiveInfringement(user: IUser | undefined | null): IInfringement | null {
    if (!user) return null;
    if (user.activeInfringement) return user.activeInfringement;

    const infringements = user.infringements ?? [];
    if (infringements.length === 0) return null;

    const indefiniteInfringement = infringements.find(isInfringementIndefinite);
    if (indefiniteInfringement) return indefiniteInfringement;

    return (
        infringements
            .filter((infringement) => isInfringementTimeBased(infringement) && !isInfringementExpired(infringement))
            .sort(
                (a, b) =>
                    (b.createdAt ? new Date(b.createdAt).getTime() : 0) -
                    (a.createdAt ? new Date(a.createdAt).getTime() : 0),
            )[0] ?? null
    );
}

/**
 * Formats a list of hosts using Intl.ListFormat for natural language display
 * @param hosts Array of user objects with username property
 * @param options Optional formatting options
 * @returns Formatted string like "Host1, Host2, and Host3"
 */
export function formatHostsList(
    hosts: { username: string; osuProfileUrl?: string }[],
    options: {
        style?: "long" | "short" | "narrow";
        type?: "conjunction" | "disjunction" | "unit";
        mdLinks?: boolean;
    } = {},
): string {
    if (!hosts || hosts.length === 0) return "";

    const { style = "long", type = "conjunction", mdLinks = false } = options;
    const formatter = new Intl.ListFormat("en", { style, type });

    return formatter.format(
        hosts.map((host) => (mdLinks ? `[**${host.username}**](${host.osuProfileUrl})` : host.username)),
    );
}
