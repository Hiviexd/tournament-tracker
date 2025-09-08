import { ApiScope, IApiKey } from "../../interfaces/ApiKey";
import User from "../models/userModel";
import ApiKey from "../models/apiKeyModel";
import utils from "../../utils";
import { IUser } from "../../interfaces/User";
import { Request } from "express";

export default class ApiKeyService {
    /**
     * Creates a new API key for a user
     * @param user - the user to create the API key for
     * @param options - the options for the API key
     * @returns the raw and API key
     */
    static async createKey(user: IUser, options: { name: string; scopes: ApiScope[], isElevated: boolean }): Promise<{ rawKey: string; apiKey: IApiKey }> {
        const existing = await ApiKey.findOne({ user, revokedAt: null });
        if (existing) {
            throw Object.assign(new Error("API key already exists for this user"), { status: 409 });
        }

        const { raw, hashed } = utils.generateApiKey();

        const apiKey = await ApiKey.create({
            user,
            hashedKey: hashed,
            name: options.name,
            scopes: options.scopes,
            createdAt: new Date(),
            lastUsedAt: undefined,
            timesUsed: 0,
            lastRouteUsed: "",
            revokedAt: null,
            isElevated: false, // Replace with options.isElevated when we allow it to be set
        });

        return { rawKey: raw, apiKey };
    }

    /**
     * Revokes an API key for a user
     * @param user - the user to revoke the API key for
     * @returns the API key
     */
    static async revokeKey(user: IUser) {

        const apiKey = await ApiKey.findOne({ user, revokedAt: null });

        if (apiKey) {
            apiKey.revokedAt = new Date();
            await apiKey.save();
            return { apiKey, alreadyRevoked: false };
        }

        return { apiKey: null, alreadyRevoked: true } as const;
    }

    /**
     * Validates an API key for use
     * @param rawKey - the raw API key
     * @returns the user and API key
     */
    static async validate(rawKey: string, req: Request): Promise<{ user: IUser; apiKey: IApiKey } | null> {
        const { hashed } = utils.generateApiKey(rawKey);

        const apiKey = await ApiKey.findOne({ hashedKey: hashed });
        if (!apiKey || apiKey.revokedAt) return null;

        const user = await User.findById(apiKey.user).orFail();
        if (!user) return null;

        // Lobotomize user if not elevated
        if (!apiKey.isElevated) {
            user.groups = ["user"];
        }

        apiKey.lastUsedAt = new Date();
        apiKey.timesUsed++;
        apiKey.lastRouteUsed = req.originalUrl || "";
        await apiKey.save();

        return { user, apiKey };
    }

    /**
     * Gets an API key for a user
     * @param user - the user to get the API key for
     * @returns the API key document, minus the hashed key
     */
    static async getForUser(user: IUser): Promise<Omit<IApiKey, "hashedKey"> | null> {
        const found = await ApiKey.findOne({ user, revokedAt: null }).select("-hashedKey");

        if (found) return found;
        return null;
    }
}
