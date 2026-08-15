import { ApiScope, IApiKey } from "@tc/types/ApiKey";
import User from "../models/userModel";
import ApiKey from "../models/apiKeyModel";
import utils from "@tc/utils/server";
import { IUser } from "@tc/types/User";

export default class ApiKeyService {
    /**
     * Creates a new API key for a user
     * @param user - the user to create the API key for
     * @param options - the options for the API key
     * @returns the raw and API key
     */
    static async createKey(
        user: IUser,
        options: { name: string; scopes: ApiScope[]; isElevated: boolean },
    ): Promise<{ rawKey: string; apiKey: IApiKey }> {
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
     * Revokes a specific API key by id (admin only).
     * @param keyId - the API key document _id
     * @returns the revoked key or null if not found / already revoked
     */
    static async revokeKeyById(keyId: string): Promise<{ apiKey: IApiKey | null; alreadyRevoked: boolean }> {
        const apiKey = await ApiKey.findById(keyId).select("-hashedKey").populate("user");
        if (!apiKey) return { apiKey: null, alreadyRevoked: false };
        if (apiKey.revokedAt) return { apiKey, alreadyRevoked: true };
        apiKey.revokedAt = new Date();
        await apiKey.save();
        return { apiKey, alreadyRevoked: false };
    }

    /**
     * Validates an API key for use
     * @param rawKey - the raw API key
     * @returns the user and API key
     */
    static async validate(
        rawKey: string,
        req: { originalUrl?: string },
    ): Promise<{ user: IUser; apiKey: IApiKey } | null> {
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
     * Updates an API key for a user
     * @param user - the user to update the API key for
     * @param options - the options to update
     * @returns the updated API key
     */
    static async updateKey(user: IUser, options: { scopes: ApiScope[] }): Promise<IApiKey> {
        const apiKey = await ApiKey.findOne({ user, revokedAt: null });
        if (!apiKey) {
            throw Object.assign(new Error("No active API key found for this user"), { status: 404 });
        }

        apiKey.scopes = options.scopes;
        await apiKey.save();

        return apiKey;
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

    /**
     * Gets all API keys grouped by user
     * @returns all API keys
     */
    static async getAllKeys(): Promise<{ user: IUser; apiKeys: IApiKey[] }[]> {
        const keys = await ApiKey.find({})
            .select("-hashedKey")
            .sort({ lastUsedAt: -1, createdAt: -1 })
            .populate("user");

        // group results by user, where it's an array of the following object: { user: IUser, apiKeys: IApiKey[] }
        const groupedByUser = new Map<string, { user: IUser; apiKeys: IApiKey[] }>();

        for (const key of keys) {
            const userId = key.user._id.toString();

            if (!groupedByUser.has(userId)) {
                groupedByUser.set(userId, {
                    user: key.user,
                    apiKeys: [],
                });
            }

            groupedByUser.get(userId)!.apiKeys.push(key);
        }

        // Sort each user's API keys so active (non-revoked) key comes first
        const result = Array.from(groupedByUser.values());
        result.forEach((userGroup) => {
            userGroup.apiKeys.sort((a, b) => {
                // Active (non-revoked) keys first
                const aActive = !a.revokedAt;
                const bActive = !b.revokedAt;

                if (aActive && !bActive) return -1;
                if (!aActive && bActive) return 1;

                // If both are same status, sort by lastUsedAt then createdAt (most recent first)
                if (a.lastUsedAt && b.lastUsedAt) {
                    return new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime();
                }
                if (a.lastUsedAt && !b.lastUsedAt) return -1;
                if (!a.lastUsedAt && b.lastUsedAt) return 1;

                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });
        });

        return result;
    }
}
