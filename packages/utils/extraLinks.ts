import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { ExtraLinkType } from "@tc/types/Tournament";

export { EXTRA_LINK_DEFAULTS, EXTRA_LINK_TYPES } from "./common";

export const EXTRA_LINK_FA_ICONS = {
    news: "newspaper",
    wiki: "book",
    challonge: "trophy",
    sheet: ["fab", "google"],
    website: "link",
    contest: "medal",
    discord: ["fab", "discord"],
    twitch: ["fab", "twitch"],
    youtube: ["fab", "youtube"],
} as const satisfies Partial<Record<ExtraLinkType, IconProp>>;

export const EXTRA_LINK_SVG_ICONS = {
    mappersguild: "/assets/mg-icon.svg",
} as const satisfies Partial<Record<ExtraLinkType, string>>;
