import axios, { AxiosRequestConfig } from "axios";
import querystring from "querystring";
import helpers from "..";
import { IOsuAuthResponse, IOsuUser } from "../../../interfaces/OsuApi";
import { ErrorResponse } from "../../../interfaces/Responses";
import config from "../../../config.json";

export default class OsuApi {
    static isOsuResponseError(
        errorResponse: IOsuAuthResponse | IOsuUser | ErrorResponse
    ): errorResponse is ErrorResponse {
        return (errorResponse as ErrorResponse).error !== undefined;
    }

    private static async executeRequest(options: AxiosRequestConfig) {
        try {
            const res = await axios(options);

            if (res?.data) {
                return res.data;
            }

            return helpers.defaultErrorMessage;
        } catch (error) {
            return helpers.defaultErrorMessage;
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

    static async getUserInfo(token: string, userId: number): Promise<IOsuUser | ErrorResponse> {
        const options: AxiosRequestConfig = {
            url: `https://osu.ppy.sh/api/v2/users/${userId}`,
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        };

        return await this.executeRequest(options);
    }
}
