import { Document, Model } from "mongoose";
import { IReviewChecklists } from "./Checklist";

export const SETTINGS_GLOBAL_KEY = "global";

export interface ISettings extends Document {
    key: typeof SETTINGS_GLOBAL_KEY;
    checklist: IReviewChecklists;
    createdAt: Date;
    updatedAt: Date;
}

export interface ISettingsStatics extends Model<ISettings> {
    getSingleton(): Promise<ISettings>;
}
