import { GameMode, TournamentType, TournamentStatus, ITournamentExtraLink } from "@tc/types/Tournament";
import { IUser } from "@tc/types/User";

export const STEPS = ["Basics", "Metadata", "Conclusion", "Overview"] as const;

export const badgeUploadOptions = {
    maxFiles: 8,
    maxSize: 5 * 1024 * 1024,
    allowedTypes: ["image/png"],
};

export type TournamentCreateFormValues = {
    name: string;
    hostIds: string[];
    modes: GameMode[];
    type: TournamentType | "";
    status: TournamentStatus | "";
    bannerUrl: string;
    forumUrl: string;
    startDate: Date | null;
    endDate: Date | null;
    enchantUrl: string;
    threadId: string;
    tags: string[];
    extraLinks: ITournamentExtraLink[];
};

export type TournamentCreatePayload = Omit<TournamentCreateFormValues, "threadId"> & {
    threadId?: string;
    winners: IUser[];
};

export const initialFormValues: TournamentCreateFormValues = {
    name: "",
    hostIds: [],
    modes: [],
    type: "",
    status: "",
    bannerUrl: "",
    forumUrl: "",
    startDate: null,
    endDate: null,
    enchantUrl: "",
    threadId: "",
    tags: [],
    extraLinks: [],
};

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
