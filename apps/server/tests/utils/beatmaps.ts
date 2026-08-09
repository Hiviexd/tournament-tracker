import { IBeatmapset } from "@tc/types/OsuApi";

/**
 * Creates a mock beatmapset object for testing purposes.
 * @param overrides - Partial properties to override in the mock beatmapset
 * @returns A mock beatmapset object with default values and overrides applied
 */
export function createMockBeatmapset(overrides: Partial<IBeatmapset> = {}): IBeatmapset {
    return {
        id: 123456,
        artist: "Test Artist",
        artist_unicode: "Test Artist",
        title: "Test Title",
        title_unicode: "Test Title",
        creator: "TestMapper",
        user_id: 789,
        status: "pending",
        tags: "test mapping",
        source: "",
        favourite_count: 0,
        hype: null,
        nsfw: false,
        offset: 0,
        play_count: 0,
        spotlight: false,
        deleted_at: null,
        ranked: 0,
        ratings: [],
        covers: {
            cover: "https://example.com/cover.jpg",
            "cover@2x": "https://example.com/cover@2x.jpg",
            card: "https://example.com/card.jpg",
            "card@2x": "https://example.com/card@2x.jpg",
            list: "https://example.com/list.jpg",
            "list@2x": "https://example.com/list@2x.jpg",
            slimcover: "https://example.com/slimcover.jpg",
            "slimcover@2x": "https://example.com/slimcover@2x.jpg",
        },
        preview_url: "https://example.com/preview.mp3",
        video: false,
        bpm: 120,
        can_be_hyped: true,
        discussion_enabled: true,
        discussion_locked: false,
        is_scoreable: true,
        last_updated: "2024-01-01T00:00:00Z",
        legacy_thread_url: "",
        nominations_summary: {
            current: 0,
            eligible_main_rulesets: ["osu", "taiko"],
            required_meta: {
                main_ruleset: 0,
                non_main_ruleset: 1,
            },
        },
        ranked_date: "2024-01-01T00:00:00Z",
        storyboard: false,
        submitted_date: "2024-01-01T00:00:00Z",
        availability: {
            download_disabled: false,
            more_information: null,
        },
        track_id: null,
        ...overrides,
    };
}
