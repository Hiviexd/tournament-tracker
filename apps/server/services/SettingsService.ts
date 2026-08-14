import { IReviewChecklists } from "@tc/types/Checklist";
import { ISettings } from "@tc/types/Settings";
import Settings from "../models/settingsModel";

class SettingsService {
    public get(): Promise<ISettings> {
        return Settings.getSingleton();
    }

    public async updateChecklist(checklist: IReviewChecklists): Promise<ISettings> {
        const settings = await Settings.getSingleton();
        settings.checklist = checklist;
        await settings.save();
        return settings;
    }
}

export default new SettingsService();
