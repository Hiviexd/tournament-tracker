import { Request, Response } from "express";
import ApiKeyService from "../services/ApiKeyService";
import { AvailableApiScopes } from "../../interfaces/ApiKey";
import LogService from "../services/LogService";
import DiscordService from "../services/DiscordService";
import webhookColors from "../constants/webhookColors";

class ApiKeysController {
    /** POST create API key (single per user) - returns raw key once */
    public async create(req: Request, res: Response) {
        const { name, scopes, isElevated } = req.body || {};

        if (!name) {
            return res.status(400).json({ error: "Name is required" });
        }

        // validate scopes from enum
        if (!scopes.every((scope) => Object.values(AvailableApiScopes).includes(scope as AvailableApiScopes))) {
            return res.status(400).json({ error: "Invalid scopes" });
        }

        const { rawKey, apiKey } = await ApiKeyService.createKey(res.locals!.user!, {
            name: String(name),
            scopes,
            isElevated,
        });

        await LogService.generate(res.locals!.user!._id, `Created API key: **${apiKey.name}**`, "api_key");

        await DiscordService.sendWebhook({
            embeds: [
                {
                    author: DiscordService.defaultWebhookAuthor(req.session),
                    color: webhookColors.white,
                    description: `Created new API key: **${apiKey.name}**`,
                },
            ],
            webhook: "dev",
        });

        return res.status(201).json({ key: rawKey, apiKey: { ...apiKey.toObject(), hashedKey: undefined } });
    }

    /** GET key metadata (no secret) */
    public async get(_: Request, res: Response) {
        const apiKey = await ApiKeyService.getForUser(res.locals!.user!);
        return res.json({ apiKey: apiKey ? { ...apiKey.toObject(), hashedKey: undefined } : null });
    }

    /** POST revoke key */
    public async revoke(req: Request, res: Response) {
        const result = await ApiKeyService.revokeKey(res.locals!.user!);
        if (result.apiKey && !result.alreadyRevoked) {
            await LogService.generate(res.locals!.user!._id, `Revoked API key: **${result.apiKey.name}**`, "api_key");
            await DiscordService.sendWebhook({
                embeds: [
                    {
                        author: DiscordService.defaultWebhookAuthor(req.session),
                        color: webhookColors.gray,
                        description: `Revoked API key: **${result.apiKey.name}**`,
                    },
                ],
                webhook: "dev",
            });
        }
        return res.json({ message: "API key revoked" });
    }
}

export default new ApiKeysController();
