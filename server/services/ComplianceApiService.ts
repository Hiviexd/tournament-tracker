import axios, { AxiosRequestConfig } from "axios";
import config from "../../config.json";
import { IComplianceApiResponse } from "../../interfaces/ComplianceApi";

export default class ComplianceApiService {
    static async validateBeatmaps(beatmapIds: (string | number)[]) {
        if (
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
            },
            data: { beatmapIds },
        };
        const response = await axios(options);

        const data: IComplianceApiResponse = response.data;

        return data;
    }
}
