import { Request, Response } from "express";
import BeatmapService from "../services/BeatmapService";
import OsuApiService from "@tc/osu/OsuApiService";
import OsuBotService from "@tc/osu/OsuBotService";
import { IBeatmap, IBeatmapWithNotes } from "@tc/types/OsuApi";
import utils from "@tc/utils/server";

/**
 * @deprecated Replaced with ComplianceController
 */
class BeatmapsController {
    /** POST check mappool compliance */
    public async checkMappoolCompliance(req: Request, res: Response) {
        const input = req.body.input;
        if (!input || typeof input !== "string") {
            return res.status(400).json({ error: "Invalid input" });
        }

        const beatmapIds = utils.sanitizeBeatmapInput(input);
        if (beatmapIds.size === 0) {
            return res.status(400).json({ error: "No valid beatmap IDs found" });
        }

        // Fetch and categorize all beatmaps
        let allowed: IBeatmap[] = [];
        let partial: IBeatmapWithNotes[] = [];
        let disallowed: IBeatmap[] = [];
        const errors: string[] = [];

        const botToken = await OsuBotService.getPublicBotToken();

        if (OsuApiService.isOsuResponseError(botToken)) {
            return res.status(500).json({ error: "Failed to get osu! API token" });
        }

        // get beatmaps in batches of 50
        for (let i = 0; i < beatmapIds.size; i += 50) {
            const batch = Array.from(beatmapIds).slice(i, i + 50);
            const beatmapsResponse = await OsuApiService.getBeatmaps(batch.map(String), botToken as string);

            await utils.delay(500);

            const beatmaps = beatmapsResponse.beatmaps;

            for (const beatmap of beatmaps) {
                if (BeatmapService.isDisallowed(beatmap.beatmapset)) {
                    disallowed.push(beatmap);
                } else if (BeatmapService.isPartial(beatmap.beatmapset)) {
                    const beatmapWithNotes: IBeatmapWithNotes = {
                        ...beatmap,
                        notes: BeatmapService.getNotes(beatmap.beatmapset),
                    };
                    partial.push(beatmapWithNotes);
                } else if (BeatmapService.isAllowed(beatmap.beatmapset)) {
                    allowed.push(beatmap);
                }
            }

            // check for beatmaps that are not in the response
            // should go through beatmapIds and check if they're present in the response
            // if not, add to errors
            for (const id of batch) {
                if (!beatmaps.some((beatmap) => beatmap.id === id)) {
                    errors.push(id.toString());
                }
            }
        }

        // sort beatmaps in each array by their status
        allowed = utils.sortBeatmapsByStatus<IBeatmap>(allowed);
        partial = utils.sortBeatmapsByStatus<IBeatmapWithNotes>(partial);
        disallowed = utils.sortBeatmapsByStatus<IBeatmap>(disallowed);

        res.json({
            message: "Beatmaps checked successfully!",
            allowed,
            partial,
            disallowed,
            errors,
        });
    }
}

/** @deprecated Replaced with ComplianceController */
export default new BeatmapsController();
