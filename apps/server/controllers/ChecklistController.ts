import { Request, Response } from "express";
import { isNumber, isPlainObject, isString } from "@tc/utils/common";
import ChecklistService from "../services/ChecklistService";
import LogService from "../services/LogService";
import { EmbedBuilder } from "../services/discord/EmbedBuilder";
import { WebhookBuilder } from "../services/discord/WebhookBuilder";
import DiscordUtils from "../services/discord/DiscordUtils";
import { diffReviewChecklists, hasChecklistDiscordDiff } from "../utils/checklistDiff";
import config from "@tc/config";

type HttpError = { status: number; error: string };

function isHttpError<T>(error: T): error is T & HttpError {
    return (
        isPlainObject(error) && "status" in error && isNumber(error.status) && "error" in error && isString(error.error)
    );
}

class ChecklistController {
    /** GET review checklists (TC / CC) */
    public async getChecklists(_: Request, res: Response) {
        try {
            return res.json(await ChecklistService.getChecklists());
        } catch (error) {
            if (isHttpError(error)) {
                return res.status(error.status).json({ error: error.error });
            }
            console.error("Failed to load checklist:", error);
            return res.status(500).json({ error: "Failed to load checklist" });
        }
    }

    /** PUT replace review checklists (TC / CC) */
    public async updateChecklists(req: Request, res: Response) {
        const currentUser = res.locals!.user!;

        try {
            const previous = await ChecklistService.getChecklists();
            const checklist = await ChecklistService.updateChecklists(req.body);

            res.json({
                message: "Checklist updated successfully!",
                data: checklist,
            });

            await LogService.generate(currentUser.id, "Updated review checklist", "settings");

            const checklistUrl = `${config.baseUrl}/checklist`;
            const changes = diffReviewChecklists(previous, checklist);

            if (hasChecklistDiscordDiff(changes)) {
                const reorderNote = changes.reordered.length
                    ? `\n${changes.reordered.join(" and ")} categories were reordered.`
                    : "";
                const embed = new EmbedBuilder()
                    .setAuthor(DiscordUtils.defaultWebhookAuthor(req.session))
                    .setColor(DiscordUtils.webhookColors.orange)
                    .setDescription(`Updated the [**review checklist**](${checklistUrl})${reorderNote}`);

                for (const field of changes.fields) {
                    embed.addField(field.name, field.value);
                }

                await new WebhookBuilder().addEmbed(embed).send();
            }
        } catch (error) {
            if (isHttpError(error)) {
                return res.status(error.status).json({ error: error.error });
            }
            throw error;
        }
    }
}

export default new ChecklistController();
