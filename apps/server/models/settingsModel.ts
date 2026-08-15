import mongoose, { Schema } from "mongoose";
import { DEFAULT_REVIEW_CHECKLISTS } from "@tc/types/Checklist";
import { ISettings, ISettingsStatics, SETTINGS_GLOBAL_KEY } from "@tc/types/Settings";

function cloneChecklists() {
    return {
        tc: DEFAULT_REVIEW_CHECKLISTS.tc.map((category) => ({
            category: category.category,
            items: [...category.items],
        })),
        cc: DEFAULT_REVIEW_CHECKLISTS.cc.map((category) => ({
            category: category.category,
            items: [...category.items],
        })),
    };
}

const ChecklistCategorySchema = new Schema(
    {
        category: { type: String, required: true, trim: true },
        items: [{ type: String, required: true, trim: true }],
    },
    { _id: false },
);

const SettingsSchema = new Schema<ISettings, ISettingsStatics>(
    {
        key: { type: String, required: true, unique: true, default: SETTINGS_GLOBAL_KEY, immutable: true },
        checklist: {
            type: {
                tc: { type: [ChecklistCategorySchema], required: true },
                cc: { type: [ChecklistCategorySchema], required: true },
            },
            required: true,
            default: cloneChecklists,
        },
    },
    { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

SettingsSchema.pre("validate", async function () {
    if (!this.isNew) return;

    // SAFETY: Document.constructor is the Settings model compiled from this schema.
    const existing = await (this.constructor as ISettingsStatics).exists({ _id: { $ne: this._id } });
    if (existing) {
        throw new Error("Settings collection can only contain one document");
    }
});

SettingsSchema.statics.getSingleton = async function (this: ISettingsStatics): Promise<ISettings> {
    const existing = await this.findOne({ key: SETTINGS_GLOBAL_KEY });
    if (existing) return existing;

    try {
        return await this.create({ key: SETTINGS_GLOBAL_KEY });
    } catch (error) {
        const raced = await this.findOne({ key: SETTINGS_GLOBAL_KEY });
        if (raced) return raced;
        throw error;
    }
};

const Settings = mongoose.model<ISettings, ISettingsStatics>("Settings", SettingsSchema);

export default Settings;
