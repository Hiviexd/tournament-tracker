import { AxiosRequestConfig } from "axios";
import { IOsuBotMessage, OSU_CHAT_MESSAGE_MAX_LENGTH } from "@tc/types/OsuApi";
import { ErrorResponse } from "@tc/types/Responses";
import config from "@tc/config";
import utils from "@tc/utils/server";
import OsuApiService from "./OsuApiService";
import NotificationDispatchService from "./NotificationDispatchService";

interface TokenInfo {
    expiresAt: Date | null;
    token: string;
}

export default class OsuBotService extends OsuApiService {
    public static readonly MESSAGE_MAX_LENGTH = OSU_CHAT_MESSAGE_MAX_LENGTH;

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
     * Enqueues an announcement to specified users through the osu! chat
     * @param userIds - Array of osu! user IDs to send the announcement to
     * @param message - The message object containing channel info and content
     * @param fallbackId - Recipient used when `osuBot.allowUserMessages` is false
     * @returns true if enqueue succeeds, ErrorResponse if enqueue fails
     */
    public static async sendAnnouncement(
        userIds: number[],
        message: IOsuBotMessage,
        fallbackId?: number,
    ): Promise<true | ErrorResponse> {
        const contents = this.getAnnouncementContents(message);
        if (OsuApiService.isOsuResponseError(contents)) {
            return contents;
        }

        try {
            await NotificationDispatchService.enqueueOsuAnnouncement({
                userIds,
                message,
                fallbackId,
            });
            return true;
        } catch (error) {
            return {
                error: error instanceof Error ? error.message : "Failed to enqueue osu announcement",
            };
        }
    }

    /**
     * Sends an announcement to specified users through the osu! chat immediately.
     * Intended for queue worker dispatch only.
     */
    public static async sendAnnouncementDirect(
        userIds: number[],
        message: IOsuBotMessage,
        fallbackId?: number,
    ): Promise<{ sentTo: number[] } | ErrorResponse> {
        const contents = this.getAnnouncementContents(message);
        if (OsuApiService.isOsuResponseError(contents)) {
            return contents;
        }

        const token = await this.getBotToken();

        if (OsuApiService.isOsuResponseError(token)) {
            return token;
        }

        const finalUserIds: number[] = [];

        if (config.osuBot.allowUserMessages) {
            finalUserIds.push(...userIds);
        } else if (fallbackId) {
            console.log("osuBot.allowUserMessages is false, sending announcement to fallback ID: " + fallbackId);
            console.log("OG User IDs: " + userIds);
            finalUserIds.push(fallbackId);
        } else {
            console.log("osuBot.allowUserMessages is false, and no fallback ID was provided. Skipping announcement.");
            return { error: "No user IDs provided", statusCode: 400, source: "osu-bot" };
        }

        let channelId = message.channelId;
        let sentCount = message.sentCount ?? (channelId ? 1 : 0);

        if (!channelId) {
            await utils.delay(500);
            const createResponse = await this.executeRequest({
                url: "https://osu.ppy.sh/api/v2/chat/channels/",
                method: "POST",
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                },
                data: {
                    channel: message.channel,
                    message: contents[0],
                    target_ids: finalUserIds,
                    type: "ANNOUNCE",
                },
            });

            if (OsuApiService.isOsuResponseError(createResponse)) {
                return { ...createResponse, source: "osu-bot" };
            }

            channelId = createResponse.channel_id;
            if (!channelId) {
                return { error: "osu! API did not return a channel_id", statusCode: 500, source: "osu-bot" };
            }

            message.channelId = channelId;
            message.sentCount = 1;
            sentCount = 1;
        }

        if (contents.length === 1 || sentCount >= contents.length) {
            return { sentTo: finalUserIds };
        }

        for (let index = sentCount; index < contents.length; index++) {
            await utils.delay(500);
            const sendResponse = await this.executeRequest({
                url: `https://osu.ppy.sh/api/v2/chat/channels/${channelId}/messages`,
                method: "POST",
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                },
                data: {
                    message: contents[index],
                    is_action: false,
                },
            });

            if (OsuApiService.isOsuResponseError(sendResponse)) {
                return { ...sendResponse, source: "osu-bot" };
            }

            message.sentCount = index + 1;
        }

        return { sentTo: finalUserIds };
    }

    private static getAnnouncementContents(message: IOsuBotMessage): string[] | ErrorResponse {
        const contents = (Array.isArray(message.content) ? message.content : [message.content]).map((entry) =>
            entry.trim(),
        );
        if (contents.length === 0 || contents.some((entry) => !entry)) {
            return { error: "Announcement messages cannot be empty", statusCode: 400, source: "osu-bot" };
        }
        if (contents.some((entry) => entry.length > this.MESSAGE_MAX_LENGTH)) {
            return {
                error: `Announcement messages cannot exceed ${this.MESSAGE_MAX_LENGTH} characters`,
                statusCode: 400,
                source: "osu-bot",
            };
        }
        return contents;
    }
}
