import { AxiosRequestConfig } from "axios";
import { IOsuBotMessage } from "../../interfaces/OsuApi";
import { ErrorResponse } from "../../interfaces/Responses";
import config from "../../config.json";
import helpers from "../helpers";
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
     * Sends an announcement to specified users through the osu! chat
     * @param userIds - Array of osu! user IDs to send the announcement to
     * @param message - The message object containing channel info and content
     * @returns true if successful, ErrorResponse if failed
     */
    public static async sendAnnouncement(
        userIds: number[],
        message: IOsuBotMessage
    ): Promise<true | ErrorResponse> {
        const token = await this.getBotToken();

        if (typeof token !== "string") {
            return token;
        }

        // Add delay to prevent rate limiting
        await helpers.delay(500);

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
                target_ids: userIds,
                type: "ANNOUNCE",
            },
        };

        const response = await this.executeRequest(options);

        if (OsuApiService.isOsuResponseError(response)) {
            return response;
        }

        return true;
    }
}
