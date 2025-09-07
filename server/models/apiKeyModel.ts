import mongoose, { Schema } from "mongoose";
import { IApiKey } from "../../interfaces/ApiKey";

const ApiKeySchema = new Schema<IApiKey>(
    {
        user: { type: Schema.Types.ObjectId, ref: "User", required: true },
        hashedKey: { type: String, required: true, unique: true, index: true },
        name: { type: String, required: true },
        scopes: { type: [String], default: [] },
        createdAt: { type: Date, default: () => new Date() },
        lastUsed: { type: Date },
        revokedAt: { type: Date, default: null },
    },
    { timestamps: false }
);

const ApiKey = mongoose.model<IApiKey>("ApiKey", ApiKeySchema);

export default ApiKey;
