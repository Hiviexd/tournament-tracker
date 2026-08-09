import { atom } from "jotai";
import { TournamentStatus } from "@tc/types/Tournament";
import { loggedInUserAtom, tournamentViewModeAtom } from "./atoms";

export const tournamentMassEditModeAtom = atom<boolean>(false);
export const tournamentMassEditSelectedIdsAtom = atom<string[]>([]);
export const tournamentMassEditStatusValueAtom = atom<TournamentStatus | "">("");
export const tournamentMassEditStateValueAtom = atom<"active" | "archived" | "">("");
export const tournamentMassEditActiveBulkActionAtom = atom<"status" | "state" | null>(null);

export const tournamentCanUseMassEditAtom = atom((get) => {
    const user = get(loggedInUserAtom);
    const viewMode = get(tournamentViewModeAtom);
    return !!user?.isAdmin && viewMode === "table";
});

export const resetTournamentMassEditAtom = atom(null, (_get, set) => {
    set(tournamentMassEditModeAtom, false);
    set(tournamentMassEditSelectedIdsAtom, []);
    set(tournamentMassEditStatusValueAtom, "");
    set(tournamentMassEditStateValueAtom, "");
    set(tournamentMassEditActiveBulkActionAtom, null);
});
