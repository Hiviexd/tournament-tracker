import axios, { AxiosRequestConfig } from "axios";
import querystring from "querystring";
import { IBeatmap, IBeatmapResponse, IOsuAuthResponse, IOsuUser } from "@tc/types/OsuApi";
import { ErrorResponse } from "@tc/types/Responses";
import { isPlainObject, isString } from "@tc/utils/common";
import config from "@tc/config";
import OsuApiHealthService from "./OsuApiHealthService";

export default class OsuApiService {
    static isOsuResponseError<T>(errorResponse: T | ErrorResponse): errorResponse is ErrorResponse {
        return isPlainObject(errorResponse) && "error" in errorResponse && errorResponse.error !== undefined;
    }

    private static buildErrorResponse<T>(options: AxiosRequestConfig, error: T): ErrorResponse {
        if (axios.isAxiosError(error)) {
            const statusCode = error.response?.status;
            const responseData = error.response?.data;
            let message =
                error.message || `osu! api request failed: ${options.method || "GET"} ${options.url || "unknown-url"}`;
            if (isPlainObject(responseData)) {
                if (isString(responseData.error)) message = responseData.error;
                else if (isString(responseData.message)) message = responseData.message;
            }

            return {
                error: String(message),
                statusCode,
                details: responseData ?? null,
                source: "osu-api",
            };
        }

        return {
            error:
                error instanceof Error
                    ? error.message
                    : `osu! api request failed: ${options.method || "GET"} ${options.url || "unknown-url"}`,
            source: "osu-api",
        };
    }

    protected static async executeRequest(options: AxiosRequestConfig) {
        try {
            const res = await axios(options);

            if (res?.data) {
                OsuApiHealthService.recordSuccess();
                return res.data;
            }

            const emptyResponse: ErrorResponse = {
                error: "osu api returned an empty response body",
                statusCode: res?.status,
                source: "osu-api",
            };

            if (OsuApiHealthService.isInfrastructureFailure(emptyResponse)) {
                OsuApiHealthService.recordFailure(emptyResponse);
            }

            return emptyResponse;
        } catch (error) {
            const errorResponse = this.buildErrorResponse(options, error);

            if (OsuApiHealthService.isInfrastructureFailure(errorResponse)) {
                OsuApiHealthService.recordFailure(errorResponse);
            }

            return errorResponse;
        }
    }

    static async getToken(code: string): Promise<IOsuAuthResponse | ErrorResponse> {
        const postData = querystring.stringify({
            grant_type: "authorization_code",
            code,
            redirect_uri: config.osuApp.redirect,
            client_id: config.osuApp.id,
            client_secret: config.osuApp.secret,
        });

        const options: AxiosRequestConfig = {
            url: "https://osu.ppy.sh/oauth/token",
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            data: postData,
        };

        return await this.executeRequest(options);
    }

    static async refreshToken(refreshToken: string): Promise<IOsuAuthResponse | ErrorResponse> {
        const postData = querystring.stringify({
            grant_type: "refresh_token",
            client_id: config.osuApp.id,
            client_secret: config.osuApp.secret,
            refresh_token: refreshToken,
        });

        const options: AxiosRequestConfig = {
            url: "https://osu.ppy.sh/oauth/token",
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            data: postData,
        };

        return await this.executeRequest(options);
    }

    static async getLoggedInUserInfo(token: string): Promise<IOsuUser | ErrorResponse> {
        const options: AxiosRequestConfig = {
            url: "https://osu.ppy.sh/api/v2/me",
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        };

        return await this.executeRequest(options);
    }

    static async getUserInfo(token: string, userInput: string | number): Promise<IOsuUser | ErrorResponse> {
        const options: AxiosRequestConfig = {
            url: `https://osu.ppy.sh/api/v2/users/${userInput}`,
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        };

        return await this.executeRequest(options);
    }

    static async getBeatmap(beatmapId: string, token: string): Promise<IBeatmap | ErrorResponse> {
        const options: AxiosRequestConfig = {
            url: `https://osu.ppy.sh/api/v2/beatmaps/${beatmapId}`,
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        };

        return await this.executeRequest(options);
    }

    // gets up to 50 beatmaps at a time, passed via an ids[] query parameter
    static async getBeatmaps(beatmapIds: string[], token: string): Promise<IBeatmapResponse> {
        const options: AxiosRequestConfig = {
            url: `https://osu.ppy.sh/api/v2/beatmaps`,
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
            params: {
                ids: beatmapIds,
            },
        };

        return await this.executeRequest(options);
    }
}
