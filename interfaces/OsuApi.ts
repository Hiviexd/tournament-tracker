export type OsuGameMode = "osu" | "taiko" | "fruits" | "mania";

/** Badges of an osu! user */
export interface IOsuBadges {
    awarded_at: Date;
    description: string;
    image_url: string;
    "image@2x_url": string;
    url?: string;
}

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
    content: string;
}
