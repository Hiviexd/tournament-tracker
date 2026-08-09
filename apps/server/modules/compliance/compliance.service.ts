import { BadRequestException, HttpException, Injectable } from "@nestjs/common";
import ComplianceApiService from "../../services/ComplianceApiService";
import { ComplianceStatus, IValidationResult } from "@tc/types/ComplianceApi";
import utils from "@tc/utils/server";
import type { IUser } from "@tc/types/User";

@Injectable()
export class ComplianceService {
    async validateBeatmaps(input: unknown, user: IUser) {
        if (!input || typeof input !== "string") {
            throw new BadRequestException("Invalid input");
        }

        const beatmapIds = utils.sanitizeBeatmapInput(input);
        if (beatmapIds.size === 0) {
            throw new BadRequestException("No valid beatmap IDs found");
        }

        const data = await ComplianceApiService.validateBeatmaps(Array.from(beatmapIds), user);

        if ("statusCode" in data) {
            throw new HttpException(`${data.error} — ${data.message}`, data.statusCode);
        }

        const allowed: IValidationResult[] = [];
        const partial: IValidationResult[] = [];
        const disallowed: IValidationResult[] = [];

        for (const beatmap of data.results) {
            switch (beatmap.complianceStatus) {
                case ComplianceStatus.DISALLOWED:
                    disallowed.push(beatmap);
                    break;
                case ComplianceStatus.POTENTIALLY_DISALLOWED:
                    partial.push(beatmap);
                    break;
                case ComplianceStatus.OK:
                    allowed.push(beatmap);
                    break;
            }
        }

        return {
            message: "Beatmaps validated successfully!",
            allowed: utils.sortBeatmapsByStatus<IValidationResult>(allowed),
            partial: utils.sortBeatmapsByStatus<IValidationResult>(partial),
            disallowed: utils.sortBeatmapsByStatus<IValidationResult>(disallowed),
            errors: data.failures,
        };
    }
}
