export const OSU_GAME_MODES = ["osu", "taiko", "fruits", "mania"] as const;
export type OsuGameMode = (typeof OSU_GAME_MODES)[number];

/** Profile cover of an osu! user */
export interface IOsuCover {
    custom_url: string;
    url: string;
    id: number;
}

/** Country of an osu! user */
export interface IOsuCountry {
    /** Country code (ISO 3166-1 alpha-2) */
    code: string;
    /** Country name */
    name: string;
}

/** An osu! user group. */
export interface IOsuGroup {
    /** Color of the group. */
    colour?: string;
    /** Whether this group displays a listing at `/groups/{id}`. */
    has_listing: boolean;
    /** Whether this group associates Rulesets with users' memberships. */
    has_playmodes: boolean;
    /** Group ID */
    id: number;
    /** Unique string to identify the group. */
    identifier: string;
    /** Whether members of this group are considered probationary. */
    is_probationary: boolean;
    /** Group name */
    name: string;
    /** Short name of the group for display. */
    short_name: string;
    /** Rulesets associated with this membership (null if has_playmodes is unset). */
    playmodes?: OsuGameMode[];
}

export interface IOsuBadge {
    awarded_at: Date;
    description: string;
    image_url: string;
    "image@2x_url": string;
    url?: string;
}

export interface IOsuUser {
    id: number;
    username: string;
    country: IOsuCountry;
    cover: IOsuCover;
    avatar_url: string;
    profile_colour?: string;
    title?: string;
    support_level?: number;
    groups?: IOsuGroup[];
    badges?: IOsuBadge[];
}

export interface IOsuAuthResponse {
    expires_in: number;
    access_token: string;
    refresh_token: string;
}

export interface IOsuMessageChannel {
    name: string;
    description?: string;
}

export interface IOsuBotMessage {
    channel: IOsuMessageChannel;
    content: string | string[];
    channelId?: number;
    sentCount?: number;
}

export interface IBeatmap {
    beatmapset_id: number;
    difficulty_rating: number;
    id: number;
    mode: string;
    status: string;
    total_length: number;
    user_id: number;
    version: string;
    accuracy: number;
    ar: number;
    bpm: number;
    convert: boolean;
    count_circles: number;
    count_sliders: number;
    count_spinners: number;
    cs: number;
    deleted_at: null;
    drain: number;
    hit_length: number;
    is_scoreable: boolean;
    last_updated: string;
    mode_int: number;
    passcount: number;
    playcount: number;
    ranked: number;
    url: string;
    checksum: string;
    beatmapset: IBeatmapset;
    failtimes: IBeatmapFailtimes;
    max_combo: number;
    owners: IBeatmapOwner[];
}

export interface IBeatmapWithNotes extends IBeatmap {
    notes?: string | null;
}

export interface IBeatmapOwner {
    id: number;
    username: string;
}

export interface IBeatmapFailtimes {
    fail: number[];
    exit: number[];
}

export interface IBeatmapset {
    artist: string;
    artist_unicode: string;
    covers: IBeatmapCovers;
    creator: string;
    favourite_count: number;
    hype: null;
    id: number;
    nsfw: boolean;
    offset: number;
    play_count: number;
    preview_url: string;
    source: string;
    spotlight: boolean;
    status: string;
    title: string;
    title_unicode: string;
    track_id: number | null;
    user_id: number;
    video: boolean;
    bpm: number;
    can_be_hyped: boolean;
    deleted_at: null;
    discussion_enabled: boolean;
    discussion_locked: boolean;
    is_scoreable: boolean;
    last_updated: string;
    legacy_thread_url: string;
    nominations_summary: IBeatmapNominationsSummary;
    ranked: number;
    ranked_date: string;
    storyboard: boolean;
    submitted_date: string;
    tags: string;
    availability: IBeatmapAvailability;
    ratings: number[];
}

export interface IBeatmapAvailability {
    download_disabled: boolean;
    more_information: string | null;
}

export interface IBeatmapNominationsSummary {
    current: number;
    eligible_main_rulesets: string[];
    required_meta: IBeatmapRequiredMeta;
}

export interface IBeatmapRequiredMeta {
    main_ruleset: number;
    non_main_ruleset: number;
}

export interface IBeatmapCovers {
    cover: string;
    "cover@2x": string;
    card: string;
    "card@2x": string;
    list: string;
    "list@2x": string;
    slimcover: string;
    "slimcover@2x": string;
}

export interface IBeatmapResponse {
    beatmaps: IBeatmap[];
    error?: string;
}
