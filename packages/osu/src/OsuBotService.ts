import { AxiosRequestConfig } from "axios";
import { IOsuBotMessage } from "@tc/types/OsuApi";
import { ErrorResponse } from "@tc/types/Responses";
import config from "@tc/config";
import utils from "@tc/utils/server";
import OsuApiService from "./OsuApiService";

interface TokenInfo {
    expiresAt: Date | null;
    token: string;
}

export default class OsuBotService extends OsuApiService {
    private static tokenInfo: TokenInfo = {
        expiresAt: null,
        token: "",
    };

    private static publicTokenInfo: TokenInfo = {
        expiresAt: null,
        token: "",
    };

    /**
     * Gets a token for the bot with `delegate`, `chat.write`, and `chat.write_manage` scopes
     * @returns The bot token
     */
    private static async getBotToken(): Promise<string | ErrorResponse> {
        // Return existing token if it's still valid
        if (this.tokenInfo.expiresAt && this.tokenInfo.expiresAt > new Date()) {
            return this.tokenInfo.token;
        }

        const options: AxiosRequestConfig = {
            url: "https://osu.ppy.sh/oauth/token",
            method: "POST",
            data: {
                grant_type: "client_credentials",
                client_id: config.osuBot.id,
                client_secret: config.osuBot.secret,
                scope: "delegate chat.write chat.write_manage",
            },
        };

        const response = await this.executeRequest(options);

        if (OsuApiService.isOsuResponseError(response)) {
            return response;
        }

        this.tokenInfo = {
            expiresAt: new Date(Date.now() + response.expires_in * 1000),
            token: response.access_token,
        };

        return response.access_token;
    }

    /**
     * Gets a token for the bot with `public` scope
     * @returns The bot token
     */
    public static async getPublicBotToken(): Promise<string | ErrorResponse> {
        if (this.publicTokenInfo.expiresAt && this.publicTokenInfo.expiresAt > new Date()) {
            return this.publicTokenInfo.token;
        }

        const options: AxiosRequestConfig = {
            url: "https://osu.ppy.sh/oauth/token",
            method: "POST",
            data: {
                grant_type: "client_credentials",
                client_id: config.osuBot.id,
                client_secret: config.osuBot.secret,
                scope: "public",
            },
        };

        const response = await this.executeRequest(options);

        if (OsuApiService.isOsuResponseError(response)) {
            return response;
        }

        this.publicTokenInfo = {
            expiresAt: new Date(Date.now() + response.expires_in * 1000),
            token: response.access_token,
        };

        return response.access_token;
    }

    /**
     * Sends an announcement to specified users through the osu! chat immediately.
     * Intended for queue worker dispatch only.
     */
    public static async sendAnnouncementDirect(
        userIds: number[],
        message: IOsuBotMessage,
        fallbackId?: number,
    ): Promise<true | ErrorResponse> {
        const token = await this.getBotToken();

        if (typeof token !== "string") {
            return token;
        }

        const finalUserIds: number[] = [];

        // Prevent sending announcements to actual users in dev env
        // TODO: isolate fallbackId to this method and try to remove the extra param from the main method
        // ? Possibly look into saving the req.ession into env? or try to somehow access it from here
        if (process.env.NODE_ENV === "production") {
            finalUserIds.push(...userIds);
        } else if (fallbackId) {
            console.log("Non-production environment detected, sending osu! announcement to fallback ID: " + fallbackId);
            console.log("OG User IDs: " + userIds);
            finalUserIds.push(fallbackId);
        } else {
            console.log(
                "Non-production environment detected, but no fallback ID provided. Skipping osu! announcement.",
            );
            return { error: "No user IDs provided", statusCode: 400, source: "osu-bot" } as ErrorResponse;
        }

        // Add delay to prevent rate limiting
        await utils.delay(500);

        const options: AxiosRequestConfig = {
            url: "https://osu.ppy.sh/api/v2/chat/channels/",
            method: "POST",
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
            },
            data: {
                channel: message.channel,
                message: message.content,
                target_ids: finalUserIds,
                type: "ANNOUNCE",
            },
        };

        const response = await this.executeRequest(options);

        if (OsuApiService.isOsuResponseError(response)) {
            return { ...response, source: "osu-bot" };
        }

        return true;
    }
}
