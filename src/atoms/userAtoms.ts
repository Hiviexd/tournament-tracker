import { atom } from "jotai";
import { IUser } from "../../interfaces/User";

export const loggedInUserAtom = atom<IUser | null>(null);

export const initializedAtom = atom<boolean>(false);
