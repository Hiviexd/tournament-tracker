import { atom } from "jotai";
import { IUser } from "../../interfaces/User";
import { getSavedPreference } from "../hooks/useLocalPreferences";

/* Base */
export const loadingAtom = atom(true);
export const redirectAtom = atom(false);

/* User */
export const loggedInUserAtom = atom<IUser | null>(null);
export const selectedUserAtom = atom<IUser | null>(null);

/* UI */
export const tournamentViewModeAtom = atom<"cards" | "table" | "review">(
    getSavedPreference("tournaments_view_mode", "cards")
);
