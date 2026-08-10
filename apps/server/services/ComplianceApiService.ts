import { Injectable } from "@nestjs/common";
import axios, { AxiosRequestConfig } from "axios";
import config from "@tc/config";
import { IComplianceApiResponse } from "@tc/types/ComplianceApi";
import { IUser } from "@tc/types/User";

@Injectable()
export class ComplianceApiService {
    async validateBeatmaps(beatmapIds: (string | number)[], user: IUser) {
        if (
            !config.complianceApi ||
            !config.complianceApi.url ||
            config.complianceApi.url.trim() === "" ||
            !config.complianceApi.apiKey ||
            config.complianceApi.apiKey.trim() === ""
        ) {
            return {
                statusCode: 401,
                code: "UNAUTHORIZED",
                error: "Unauthorized",
                message: "Compliance API is not configured!",
            };
        }

        const API_ROUTE = "/validate";

        const options: AxiosRequestConfig = {
            url: `${config.complianceApi.url}${API_ROUTE}`,
            method: "POST",
            headers: {
                "X-Api-Key": config.complianceApi.apiKey,
                Accept: "application/json",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36",
                "Accept-Language": "en-US,en;q=0.9",
                "Content-Type": "application/json",
                "X-User-Meta": JSON.stringify({
                    osuId: user.osuId,
                    username: user.username,
                }),
            },
            data: beatmapIds,
        };
        const response = await axios(options).catch((error) => {
            return {
                data: {
                    statusCode: error.response.status,
                    code: error.response.data.code,
                    error: error.response.data.error,
                    message: error.response.data.message,
                },
            };
        });

        const data: IComplianceApiResponse = response.data;

        return data;
    }
}
