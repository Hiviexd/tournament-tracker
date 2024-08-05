import { atom } from "jotai";
import { IUser } from "../../interfaces/User";

/* Base */
export const loadingAtom = atom(true);
export const redirectAtom = atom(false);

/* User */
export const loggedInUserAtom = atom<IUser | null>(null);
export const selectedUserAtom = atom<IUser | null>(null);
export const usersAtom = atom<IUser[]>([]);
