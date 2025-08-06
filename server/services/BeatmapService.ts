import { IBeatmapset } from "../../interfaces/OsuApi";
import flaggedArtists from "../constants/artist-permissions/flagged.json";
import overrides from "../constants/artist-permissions/overrides.json";
import bannedSources from "../constants/artist-permissions/banned_sources.json";

interface FlaggedArtistData {
    status: "partial" | "disallowed";
    notes: string | null;
}

type FlaggedArtists = {
    [key: string]: FlaggedArtistData;
};

// Reference: https://github.com/hburn7/mappool-compliance-checker/blob/6a161ec8b707ba4b9d1f39857af041a9376d2309/src/validator.py
export default class BeatmapService {
    private static readonly PARTIAL_STATUS = "partial";
    private static readonly DISALLOWED_STATUS = "disallowed";

    /**
     * Checks if a beatmapset's source matches any of the banned sources
     * @param beatmapset The beatmapset to check
     * @returns True if the source is banned, false otherwise
     */
    private static isBannedSource(beatmapset: IBeatmapset): boolean {
        if (!beatmapset.source) {
            return false;
        }

        return bannedSources.some((source) => beatmapset.source.toLowerCase().includes(source.toLowerCase()));
    }

    /**
     * Checks if a beatmapset has been DMCA'd
     * @param beatmapset The beatmapset to check
     * @returns True if the beatmapset has been DMCA'd, false otherwise
     */
    private static isDMCA(beatmapset: IBeatmapset): boolean {
        return beatmapset.availability.download_disabled || beatmapset.availability.more_information !== null;
    }

    /**
     * Checks if a track is licensed (has a track_id)
     * @param trackId The track ID to check
     * @returns True if the track is licensed, false otherwise
     */
    private static isLicensed(trackId: number | null): boolean {
        return trackId !== null;
    }

    /**
     * Checks if a beatmap status is approved (ranked, approved, or loved)
     * @param status The status to check
     * @returns True if the status is approved, false otherwise
     */
    private static isStatusApproved(status: string): boolean {
        return ["ranked", "approved", "loved"].includes(status.toLowerCase());
    }

    /**
     * Checks if any flagged artist is present in the given text
     * @param text The text to check (artist name, title, etc.)
     * @returns Object with found status and matching key
     */
    private static isArtistInText(text: string): { found: boolean; key: string | null } {
        const keys = Object.keys(flaggedArtists);
        const textLower = text.toLowerCase();

        for (const key of keys) {
            if (key.toLowerCase() === textLower) {
                return { found: true, key };
            }
        }

        for (const key of keys) {
            const keyLower = key.toLowerCase();
            // Regex pattern with word boundaries
            const pattern = new RegExp(`\\b${keyLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
            if (pattern.test(text)) {
                return { found: true, key };
            }
        }

        return { found: false, key: null };
    }

    /**
     * Checks if any flagged artist is present in the beatmapset (artist or title)
     * @param beatmapset The beatmapset to check
     * @returns True if any flagged artist is found, false otherwise
     */
    private static artistFlagged(beatmapset: IBeatmapset): boolean {
        // Check artist field
        const artistResult = this.isArtistInText(beatmapset.artist);
        if (artistResult.found) {
            return true;
        }

        // Check title field
        const titleResult = this.isArtistInText(beatmapset.title);
        return titleResult.found;
    }

    /**
     * Gets all flagged artist keys from both artist and title fields
     * @param beatmapset The beatmapset to check
     * @returns Array of all matching flagged artist keys
     */
    private static getAllFlaggedArtistKeys(beatmapset: IBeatmapset): string[] {
        const keys: string[] = [];
        const flaggedArtistsTyped = flaggedArtists as FlaggedArtists;
        const allKeys = Object.keys(flaggedArtistsTyped);

        // Check both artist and title fields
        const textsToCheck = [beatmapset.artist, beatmapset.title];

        for (const text of textsToCheck) {
            for (const key of allKeys) {
                const keyLower = key.toLowerCase();
                // Regex pattern with word boundaries
                const pattern = new RegExp(`\\b${keyLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
                if (pattern.test(text) && !keys.includes(key)) {
                    keys.push(key);
                }
            }
        }

        return keys;
    }

    /**
     * Gets the flagged artist key from either artist or title field
     * Returns the most restrictive status (disallowed > partial)
     * @param beatmapset The beatmapset to check
     * @returns The matching flagged artist key or null if no match
     */
    private static getFlaggedArtistKey(beatmapset: IBeatmapset): string | null {
        const allKeys = this.getAllFlaggedArtistKeys(beatmapset);
        if (allKeys.length === 0) {
            return null;
        }

        const flaggedArtistsTyped = flaggedArtists as FlaggedArtists;

        // Return first disallowed artist found (most restrictive)
        for (const key of allKeys) {
            if (flaggedArtistsTyped[key].status === this.DISALLOWED_STATUS) {
                return key;
            }
        }

        // Return first partial artist if no disallowed found
        for (const key of allKeys) {
            if (flaggedArtistsTyped[key].status === this.PARTIAL_STATUS) {
                return key;
            }
        }

        return allKeys[0]; // Fallback
    }

    /**
     * Checks if a beatmapset has an override for a specific status
     * @param beatmapset The beatmapset to check
     * @param targetStatus The status to check for
     * @returns True if the beatmapset is overridden to the target status
     */
    private static isOverride(beatmapset: IBeatmapset, targetStatus: string): boolean {
        return overrides.some(
            (o) => o.artist === beatmapset.artist && o.title === beatmapset.title && o.status === targetStatus
        );
    }

    /**
     * Checks if a beatmapset's tags contains banned sources
     * @param beatmapset The beatmapset to check
     * @returns True if the tags contains banned sources
     */
    private static tagsContainsBannedSource(beatmapset: IBeatmapset): boolean {
        // This was a check for descriptions, but I went with tags instead since the former
        // introduces a ton of overhead from the osu! api side (having to re-fetch Beatmapset for every Beatmap).
        const tags = beatmapset.tags?.toLowerCase() || "";
        return bannedSources.some((source) => tags.includes(source.toLowerCase()));
    }

    /**
     * Checks if a beatmapset is allowed according to current content usage permission rules
     * @param beatmapset The beatmapset to check
     * @returns True if the beatmapset is allowed
     */
    public static isAllowed(beatmapset: IBeatmapset): boolean {
        if (this.isDMCA(beatmapset)) {
            return false;
        }

        if (this.isLicensed(beatmapset.track_id) || this.isStatusApproved(beatmapset.status)) {
            return true;
        }

        if (this.isOverride(beatmapset, "allowed")) {
            return true;
        }

        if (this.isBannedSource(beatmapset)) {
            return false;
        }

        if (this.tagsContainsBannedSource(beatmapset)) {
            return false;
        }

        return !this.artistFlagged(beatmapset);
    }

    /**
     * Checks if a beatmapset has partial permissions
     * @param beatmapset The beatmapset to check
     * @returns True if the beatmapset has partial permissions
     */
    public static isPartial(beatmapset: IBeatmapset): boolean {
        if (this.isOverride(beatmapset, "partial")) {
            return true;
        }

        if (this.isAllowed(beatmapset)) {
            return false;
        }

        if (this.tagsContainsBannedSource(beatmapset)) {
            return true;
        }

        if (!this.artistFlagged(beatmapset)) {
            return false;
        }

        const key = this.getFlaggedArtistKey(beatmapset);
        if (key !== null) {
            const flaggedArtistsTyped = flaggedArtists as FlaggedArtists;
            return flaggedArtistsTyped[key].status === this.PARTIAL_STATUS;
        }

        return false;
    }

    /**
     * Checks if a beatmapset is disallowed
     * @param beatmapset The beatmapset to check
     * @returns True if the beatmapset is disallowed
     */
    public static isDisallowed(beatmapset: IBeatmapset): boolean {
        if (this.isDMCA(beatmapset)) {
            return true;
        }

        if (this.isOverride(beatmapset, "disallowed")) {
            return true;
        }

        if (this.isAllowed(beatmapset)) {
            return false;
        }

        if (this.isBannedSource(beatmapset)) {
            return true;
        }

        if (!this.artistFlagged(beatmapset)) {
            return false;
        }

        const key = this.getFlaggedArtistKey(beatmapset);
        if (key !== null) {
            const flaggedArtistsTyped = flaggedArtists as FlaggedArtists;
            return flaggedArtistsTyped[key].status === this.DISALLOWED_STATUS;
        }

        return false;
    }

    /**
     * Gets the artist notes for a beatmapset
     * @param beatmapset The beatmapset to get the notes for
     * @returns The notes for the beatmapset
     */
    public static getNotes(beatmapset: IBeatmapset): string | null {
        const key = this.getFlaggedArtistKey(beatmapset);
        if (key !== null) {
            const flaggedArtistsTyped = flaggedArtists as FlaggedArtists;
            return flaggedArtistsTyped[key].notes;
        }

        return null;
    }
}
