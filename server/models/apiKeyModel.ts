import mongoose, { Schema } from "mongoose";
import { IApiKey, AvailableApiScopes } from "../../interfaces/ApiKey";

const ApiKeySchema = new Schema<IApiKey>(
    {
        user: { type: Schema.Types.ObjectId, ref: "User", required: true },
        hashedKey: { type: String, required: true, unique: true, index: true },
        name: { type: String, required: true },
        scopes: { type: [String], default: [], enum: Object.values(AvailableApiScopes) },
        createdAt: { type: Date, default: () => new Date() },
        lastUsedAt: { type: Date },
        timesUsed: { type: Number, default: 0 },
        lastRouteUsed: { type: String, default: "" },
        revokedAt: { type: Date, default: null },
    },
    { timestamps: false }
);

const ApiKey = mongoose.model<IApiKey>("ApiKey", ApiKeySchema);

export default ApiKey;
