import { atom } from "recoil";
import { IUser } from "../../interfaces/User";


export const loggedInUser = atom<IUser | null>({
    key: "loggedInUser",
    default: null,
});

// bool state for loggedInUser being loaded
export const loggedInUserLoaded = atom<boolean>({
    key: "loggedInUserLoaded",
    default: false,
});
