import { atom } from "jotai";
import { IUser } from "../../interfaces/User";

/* User */
export const loggedInUserAtom = atom<IUser | null>(null);
export const selectedUserAtom = atom<IUser | null>(null);
export const usersAtom = atom<IUser[]>([]);
