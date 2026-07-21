import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { ExtraLinkType } from "../interfaces/Tournament";

export { EXTRA_LINK_DEFAULTS, EXTRA_LINK_TYPES } from "./common";

export const EXTRA_LINK_FA_ICONS: Partial<Record<ExtraLinkType, IconProp>> = {
    news: "newspaper",
    wiki: "book",
    challonge: "trophy",
    sheet: ["fab", "google"],
    website: "link",
    contest: "medal",
    discord: ["fab", "discord"],
    twitch: ["fab", "twitch"],
};

export const EXTRA_LINK_SVG_ICONS: Partial<Record<ExtraLinkType, string>> = {
    mappersguild: "/assets/mg-icon.svg",
};
