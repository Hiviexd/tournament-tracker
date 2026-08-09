import { GameMode, TournamentType, TournamentStatus, ITournamentExtraLink } from "@tc/types/Tournament";

export const STEPS = ["Basics", "Metadata", "Conclusion", "Overview"] as const;

export const badgeUploadOptions = {
    maxFiles: 8,
    maxSize: 5 * 1024 * 1024,
    allowedTypes: ["image/png"],
};

export const initialFormValues = {
    name: "",
    hostIds: [] as string[],
    modes: [] as GameMode[],
    type: "" as TournamentType,
    status: "" as TournamentStatus,
    bannerUrl: "",
    forumUrl: "",
    startDate: null as Date | null,
    endDate: null as Date | null,
    enchantUrl: "",
    threadId: "",
    tags: [] as string[],
    extraLinks: [] as ITournamentExtraLink[],
};

export type TournamentCreateFormValues = typeof initialFormValues;

export const STEP_FIELDS: (keyof TournamentCreateFormValues)[][] = [
    ["name", "hostIds", "modes", "type", "startDate", "endDate", "forumUrl", "bannerUrl", "enchantUrl"],
    ["extraLinks", "tags"],
    ["threadId"],
    [],
];

export function generateSuggestedTagFromName(name: string): string {
    const letterGroups = name.match(/[A-z]+/g);
    if (!letterGroups || letterGroups.length < 2) return "";

    const matches = name.match(/[A-z]+|\d+/g);
    if (!matches) return "";
    return matches
        .map((word) => (/\d/.test(word) ? word : word[0]))
        .join("")
        .toUpperCase();
}
