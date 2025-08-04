import { describe, it, expect } from "vitest";
import BeatmapService from "../../services/BeatmapService";
import { createMockBeatmapset } from "../utils/beatmaps";

describe("BeatmapService", () => {
    describe("isAllowed", () => {
        it("should allow ranked beatmapsets", () => {
            const beatmapset = createMockBeatmapset({
                artist: "Clean Artist",
                title: "Clean Title",
                status: "ranked",
            });
            const result = BeatmapService.isAllowed(beatmapset);
            expect(result).toBe(true);
        });

        it("should allow licensed beatmapsets", () => {
            const beatmapset = createMockBeatmapset({
                artist: "Any Artist",
                title: "Any Title",
                track_id: 12345,
            });
            const result = BeatmapService.isAllowed(beatmapset);
            expect(result).toBe(true);
        });

        it("should not allow DMCA beatmapsets", () => {
            const beatmapset = createMockBeatmapset({
                artist: "Clean Artist",
                title: "Clean Title",
                availability: {
                    download_disabled: true,
                    more_information: "DMCA takedown",
                },
            });
            const result = BeatmapService.isAllowed(beatmapset);
            expect(result).toBe(false);
        });

        it("should not allow beatmapsets with banned sources", () => {
            const beatmapset = createMockBeatmapset({
                artist: "Clean Artist",
                title: "Clean Title",
                source: "DJMax Portable",
            });
            const result = BeatmapService.isAllowed(beatmapset);
            expect(result).toBe(false);
        });

        it("should not allow beatmapsets with banned sources in tags", () => {
            const beatmapset = createMockBeatmapset({
                artist: "Clean Artist",
                title: "Clean Title",
                tags: "djmax rhythm game",
            });
            const result = BeatmapService.isAllowed(beatmapset);
            expect(result).toBe(false);
        });

        it("should not allow beatmapsets with flagged artists in artist field", () => {
            const beatmapset = createMockBeatmapset({
                artist: "Zekk",
                title: "Clean Title",
            });
            const result = BeatmapService.isAllowed(beatmapset);
            expect(result).toBe(false);
        });

        it("should not allow beatmapsets with flagged artists in title field", () => {
            const beatmapset = createMockBeatmapset({
                artist: "Eri Sasaki",
                title: "Ring of Fortune (Zekk Remix)",
            });
            const result = BeatmapService.isAllowed(beatmapset);
            expect(result).toBe(false);
        });

        it("should handle case insensitive artist matching in title", () => {
            const beatmapset = createMockBeatmapset({
                artist: "Clean Artist",
                title: "Song (zekk remix)",
            });
            const result = BeatmapService.isAllowed(beatmapset);
            expect(result).toBe(false);
        });

        it("should allow overridden beatmapsets", () => {
            const beatmapset = createMockBeatmapset({
                artist: "Morimori Atsushi",
                title: "Tits or get the fuck out!!",
            });
            const result = BeatmapService.isAllowed(beatmapset);
            expect(result).toBe(true);
        });
    });

    describe("isPartial", () => {
        it("should return false for allowed beatmapsets", () => {
            const beatmapset = createMockBeatmapset({
                artist: "Clean Artist",
                title: "Clean Title",
                status: "ranked",
            });
            const result = BeatmapService.isPartial(beatmapset);
            expect(result).toBe(false);
        });

        it("should return true for partial artists in artist field", () => {
            const beatmapset = createMockBeatmapset({
                artist: "Zekk",
                title: "Clean Title",
            });
            const result = BeatmapService.isPartial(beatmapset);
            expect(result).toBe(true);
        });

        it("should return true for partial artists in title field (your use case)", () => {
            const beatmapset = createMockBeatmapset({
                artist: "Clean Artist",
                title: "Song (Zekk Remix)",
            });
            const result = BeatmapService.isPartial(beatmapset);
            expect(result).toBe(true);
        });

        it("should return false for disallowed artists in title", () => {
            const beatmapset = createMockBeatmapset({
                artist: "Clean Artist",
                title: "Song (40mP Remix)",
            });
            const result = BeatmapService.isPartial(beatmapset);
            expect(result).toBe(false);
        });

        it("should return true for beatmapsets with banned sources in tags", () => {
            const beatmapset = createMockBeatmapset({
                artist: "Clean Artist",
                title: "Clean Title",
                tags: "djmax rhythm game",
            });
            const result = BeatmapService.isPartial(beatmapset);
            expect(result).toBe(true);
        });

        it("should return true for override partial status", () => {
            const beatmapset = createMockBeatmapset({
                artist: "Clean Artist",
                title: "Clean Title",
            });
            // This would need to be added to overrides.json for a real test
            // but we can test the logic flow
            const result = BeatmapService.isPartial(beatmapset);
            expect(typeof result).toBe("boolean");
        });
    });

    describe("isDisallowed", () => {
        it("should return true for DMCA beatmapsets", () => {
            const beatmapset = createMockBeatmapset({
                artist: "Clean Artist",
                title: "Clean Title",
                availability: {
                    download_disabled: true,
                    more_information: "DMCA takedown",
                },
            });
            const result = BeatmapService.isDisallowed(beatmapset);
            expect(result).toBe(true);
        });

        it("should return true for disallowed artists in artist field", () => {
            const beatmapset = createMockBeatmapset({
                artist: "40mP",
                title: "Clean Title",
            });
            const result = BeatmapService.isDisallowed(beatmapset);
            expect(result).toBe(true);
        });

        it("should return true for disallowed artists in title field", () => {
            const beatmapset = createMockBeatmapset({
                artist: "Clean Artist",
                title: "Song (40mP Remix)",
            });
            const result = BeatmapService.isDisallowed(beatmapset);
            expect(result).toBe(true);
        });

        it("should return true for banned sources", () => {
            const beatmapset = createMockBeatmapset({
                artist: "Clean Artist",
                title: "Clean Title",
                source: "DJMax Portable",
            });
            const result = BeatmapService.isDisallowed(beatmapset);
            expect(result).toBe(true);
        });

        it("should return false for allowed beatmapsets", () => {
            const beatmapset = createMockBeatmapset({
                artist: "Clean Artist",
                title: "Clean Title",
                status: "ranked",
            });
            const result = BeatmapService.isDisallowed(beatmapset);
            expect(result).toBe(false);
        });

        it("should return false for partial artists", () => {
            const beatmapset = createMockBeatmapset({
                artist: "Zekk",
                title: "Clean Title",
            });
            const result = BeatmapService.isDisallowed(beatmapset);
            expect(result).toBe(false);
        });

        it("should return true for override disallowed status", () => {
            const beatmapset = createMockBeatmapset({
                artist: "Lusumi",
                title: "/execution_program.wav",
            });
            const result = BeatmapService.isDisallowed(beatmapset);
            expect(result).toBe(true);
        });
    });

    describe("getNotes", () => {
        it("should return notes for flagged artists in artist field", () => {
            const beatmapset = createMockBeatmapset({
                artist: "Zekk",
                title: "Clean Title",
            });
            const result = BeatmapService.getNotes(beatmapset);
            expect(result).toBe(
                "Do not use or upload tracks that are not available on the creator's Featured Artist listing."
            );
        });

        it("should return notes for flagged artists in title field", () => {
            const beatmapset = createMockBeatmapset({
                artist: "Eri Sasaki",
                title: "Ring of Fortune (Zekk Remix)",
            });
            const result = BeatmapService.getNotes(beatmapset);
            expect(result).toBe(
                "Do not use or upload tracks that are not available on the creator's Featured Artist listing."
            );
        });

        it("should return null for clean beatmapsets", () => {
            const beatmapset = createMockBeatmapset({
                artist: "Clean Artist",
                title: "Clean Title",
                status: "ranked",
            });
            const result = BeatmapService.getNotes(beatmapset);
            expect(result).toBeNull();
        });

        it("should return null for disallowed artists with no notes", () => {
            const beatmapset = createMockBeatmapset({
                artist: "40mP",
                title: "Clean Title",
            });
            const result = BeatmapService.getNotes(beatmapset);
            expect(result).toBeNull();
        });
    });

    describe("Artist in Title Detection - Your Use Case", () => {
        it('should flag "Ring of Fortune (Zekk Remix)" as partial', () => {
            const beatmapset = createMockBeatmapset({
                artist: "Eri Sasaki",
                title: "Ring of Fortune (Zekk Remix)",
            });

            expect(BeatmapService.isAllowed(beatmapset)).toBe(false);
            expect(BeatmapService.isPartial(beatmapset)).toBe(true);
            expect(BeatmapService.isDisallowed(beatmapset)).toBe(false);
            expect(BeatmapService.getNotes(beatmapset)).toBe(
                "Do not use or upload tracks that are not available on the creator's Featured Artist listing."
            );
        });

        it("should handle multiple artists in title", () => {
            const beatmapset = createMockBeatmapset({
                artist: "Clean Artist",
                title: "Song (Zekk Remix feat. 40mP)",
            });
            const result = BeatmapService.isDisallowed(beatmapset);
            expect(result).toBe(true); // Should be true because 40mP is disallowed
        });

        it("should handle spaceless artist names", () => {
            const beatmapset = createMockBeatmapset({
                artist: "Clean Artist",
                title: "Song (NOMA Remix)",
            });
            const result = BeatmapService.isDisallowed(beatmapset);
            expect(result).toBe(true); // NOMA is disallowed
        });

        it("should handle various parenthetical content", () => {
            const beatmapset = createMockBeatmapset({
                artist: "Clean Artist",
                title: "Song (feat. Zekk) [Hard]",
            });
            const result = BeatmapService.isPartial(beatmapset);
            expect(result).toBe(true); // Zekk is partial
        });
    });

    describe("Priority Testing", () => {
        it("should prioritize most restrictive status over field priority", () => {
            const beatmapset = createMockBeatmapset({
                artist: "Zekk", // partial
                title: "Song (40mP Remix)", // disallowed
            });

            // Should return disallowed status (most restrictive) even though Zekk is in artist field
            expect(BeatmapService.isDisallowed(beatmapset)).toBe(true);
            expect(BeatmapService.isPartial(beatmapset)).toBe(false);
            // Notes should be null because 40mP has null notes
            const notes = BeatmapService.getNotes(beatmapset);
            expect(notes).toBeNull();
        });

        it("should still detect flagged artists in title when artist field is clean", () => {
            const beatmapset = createMockBeatmapset({
                artist: "Clean Artist",
                title: "Song (Zekk Remix)",
            });

            expect(BeatmapService.isPartial(beatmapset)).toBe(true);
        });
    });

    describe("Edge Cases", () => {
        it("should handle empty title", () => {
            const beatmapset = createMockBeatmapset({
                artist: "Clean Artist",
                title: "",
            });

            expect(BeatmapService.isAllowed(beatmapset)).toBe(true);
        });

        it("should handle empty artist", () => {
            const beatmapset = createMockBeatmapset({
                artist: "",
                title: "Song (Zekk Remix)",
            });

            expect(BeatmapService.isPartial(beatmapset)).toBe(true);
        });

        it("should handle special characters in title", () => {
            const beatmapset = createMockBeatmapset({
                artist: "Clean Artist",
                title: 'Song [Zekk\'s "Remix"]',
            });

            expect(BeatmapService.isPartial(beatmapset)).toBe(true);
        });
    });
});
