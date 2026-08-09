import { atom } from "jotai";
import { IUser } from "@tc/types/User";
import { getSavedPreference } from "../hooks/useLocalPreferences";

/* Base */
export const loadingAtom = atom(true);
export const redirectAtom = atom(false);

/* User */
export const loggedInUserAtom = atom<IUser | null>(null);
export const selectedUserAtom = atom<IUser | null>(null);

/* UI */
export const tournamentViewModeAtom = atom<"cards" | "table" | "review">(
    getSavedPreference("tournaments_view_mode", "cards"),
);
export const seasonalEffectsAtom = atom<boolean>(getSavedPreference<boolean>("seasonal_effects", true));

/* Auth */
export const csrfTokenAtom = atom<string | null>(null);
export const csrfLoadingAtom = atom<boolean>(false);
export const csrfErrorAtom = atom<string | null>(null);

// Derived atom for CSRF headers
export const csrfHeadersAtom = atom((get) => {
    const token = get(csrfTokenAtom);
    return token ? { "X-CSRF-Token": token } : {};
});

// Derived atom to check if CSRF is ready
export const csrfReadyAtom = atom((get) => {
    const token = get(csrfTokenAtom);
    const loading = get(csrfLoadingAtom);
    const error = get(csrfErrorAtom);
    return !loading && !error && token !== null;
});
