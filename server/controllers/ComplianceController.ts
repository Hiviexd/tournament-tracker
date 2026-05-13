import { Request, Response } from "express";
import ComplianceApiService from "../services/ComplianceApiService";
import { ComplianceStatus, IValidationResult } from "../../interfaces/ComplianceApi";
import utils from "../../utils/server";

class ComplianceController {
    /** POST validate beatmaps */
    public async validateBeatmaps(req: Request, res: Response) {
        const input = req.body.input;
        if (!input || typeof input !== "string") {
            return res.status(400).json({ error: "Invalid input" });
        }

        const beatmapIds = utils.sanitizeBeatmapInput(input);
        if (beatmapIds.size === 0) {
            return res.status(400).json({ error: "No valid beatmap IDs found" });
        }

        const user = res.locals!.user!;

        const data = await ComplianceApiService.validateBeatmaps(Array.from(beatmapIds), user);

        if ("statusCode" in data) {
            return res.status(data.statusCode).json({ error: `${data.error} — ${data.message}` });
        }

        // categorize all beatmaps
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

        res.json({
            message: "Beatmaps validated successfully!",
            allowed: utils.sortBeatmapsByStatus<IValidationResult>(allowed),
            partial: utils.sortBeatmapsByStatus<IValidationResult>(partial),
            disallowed: utils.sortBeatmapsByStatus<IValidationResult>(disallowed),
            errors: data.failures,
        });
    }
}

export default new ComplianceController();
