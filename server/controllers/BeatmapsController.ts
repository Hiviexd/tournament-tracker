import { Request, Response } from "express";
import BeatmapService from "../services/BeatmapService";
import OsuApiService from "../services/OsuApiService";
import { IBeatmap } from "../../interfaces/OsuApi";

interface IBeatmapWithNotes extends IBeatmap {
    notes: string | null;
}

class BeatmapsController {
    /**
     * Sanitizes user input string into a set of beatmap IDs
     * @param input The input string to sanitize
     * @returns A set of beatmap IDs
     */
    private sanitizeInput(input: string): Set<number> {
        const ids = new Set<number>();

        // Split the input by commas, spaces, tabs, or new lines
        const parts = input
            .replace(",", " ")
            .replace("\t", " ")
            .replace("\n", " ")
            .replace("#osu", "")
            .replace("#taiko", "")
            .replace("#fruits", "")
            .replace("#mania", "")
            .split(" ")
            .filter((part) => part.length > 0);

        for (const part of parts) {
            try {
                // Try to convert each part to an integer
                let processedPart = part;
                if (part.includes("/")) {
                    processedPart = part.split("/").pop() || "";
                }

                const id = parseInt(processedPart);
                if (!isNaN(id)) {
                    ids.add(id);
                }
            } catch {
                // If any part is not an integer, return an empty set
                return new Set();
            }
        }

        return ids;
    }

    /** POST check mappool compliance */
    public async checkMappoolCompliance(req: Request, res: Response) {
        const input = req.body.input;
        if (!input || typeof input !== "string") {
            return res.json({ error: "Invalid input" });
        }

        const beatmapIds = this.sanitizeInput(input);
        if (beatmapIds.size === 0) {
            return res.json({ error: "No valid beatmap IDs found" });
        }

        // Fetch and categorize all beatmaps
        const allowed: IBeatmap[] = [];
        const partial: IBeatmapWithNotes[] = [];
        const disallowed: IBeatmap[] = [];
        const errors: string[] = [];

        for (const id of beatmapIds) {
            const beatmapResponse = await OsuApiService.getBeatmap(id.toString(), req.session.accessToken!);

            if (OsuApiService.isOsuResponseError(beatmapResponse)) {
                errors.push(id.toString());
                continue; // Skip invalid beatmaps
            }

            const beatmap = beatmapResponse;

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

        res.json({
            message: "Beatmaps checked successfully!",
            allowed,
            partial,
            disallowed,
            errors,
        });
    }
}

export default new BeatmapsController();
