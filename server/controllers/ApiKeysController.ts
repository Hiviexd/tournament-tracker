import { Request, Response } from "express";
import ApiKeyService from "../services/ApiKeyService";
import { AvailableApiScopes } from "../../interfaces/ApiKey";
import LogService from "../services/LogService";
import { EmbedBuilder } from "../services/discord/EmbedBuilder";
import { WebhookBuilder } from "../services/discord/WebhookBuilder";
import DiscordUtils from "../services/discord/DiscordUtils";

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

        await LogService.generate(res.locals!.user!.id, `Created API key: **${apiKey.name}**`, "api_key");

        await new WebhookBuilder()
            .addEmbed(
                new EmbedBuilder()
                    .setAuthor(DiscordUtils.defaultWebhookAuthor(req.session))
                    .setColor(DiscordUtils.webhookColors.white)
                    .setDescription(`Created new API key: **${apiKey.name}**`)
            )
            .setLocation("dev")
            .send();

        return res
            .status(201)
            .json({ message: "API key created!", key: rawKey, apiKey: { ...apiKey.toObject(), hashedKey: undefined } });
    }

    /** GET key metadata (no secret) */
    public async get(_: Request, res: Response) {
        const apiKey = await ApiKeyService.getForUser(res.locals!.user!);
        return res.json({ apiKey: apiKey ? { ...apiKey.toObject(), hashedKey: undefined } : null });
    }

    /** PUT update API key scopes */
    public async update(req: Request, res: Response) {
        const { scopes } = req.body || {};

        // validate scopes from enum
        if (!scopes.every((scope) => Object.values(AvailableApiScopes).includes(scope as AvailableApiScopes))) {
            return res.status(400).json({ error: "Invalid scopes" });
        }

        const apiKey = await ApiKeyService.updateKey(res.locals!.user!, { scopes });

        await LogService.generate(res.locals!.user!.id, `Updated API key scopes: **${apiKey.name}**`, "api_key");

        await new WebhookBuilder()
            .addEmbed(
                new EmbedBuilder()
                    .setAuthor(DiscordUtils.defaultWebhookAuthor(req.session))
                    .setColor(DiscordUtils.webhookColors.blue)
                    .setDescription(`Updated API key scopes: **${apiKey.name}**`)
                    .addField("New Scopes", scopes.map((scope) => `\`${scope}\``).join(", "))
            )
            .setLocation("dev")
            .send();

        return res.json({ message: "API key scopes updated!", apiKey: { ...apiKey.toObject(), hashedKey: undefined } });
    }

    /** POST revoke key */
    public async revoke(req: Request, res: Response) {
        const result = await ApiKeyService.revokeKey(res.locals!.user!);
        if (result.apiKey && !result.alreadyRevoked) {
            await LogService.generate(res.locals!.user!.id, `Revoked API key: **${result.apiKey.name}**`, "api_key");
            await new WebhookBuilder()
                .addEmbed(
                    new EmbedBuilder()
                        .setAuthor(DiscordUtils.defaultWebhookAuthor(req.session))
                        .setColor(DiscordUtils.webhookColors.darkRed)
                        .setDescription(`Revoked API key: **${result.apiKey.name}**`)
                )
                .setLocation("dev")
                .send();
        }
        return res.json({ message: "API key revoked!" });
    }

    /** POST revoke a specific key by id (admin only) */
    public async revokeById(req: Request, res: Response) {
        const keyId = req.params.keyId ?? req.body?.keyId;
        if (!keyId) {
            return res.status(400).json({ error: "Key ID is required" });
        }
        const result = await ApiKeyService.revokeKeyById(keyId);
        if (!result.apiKey) {
            return res.status(404).json({ error: "API key not found" });
        }
        if (result.alreadyRevoked) {
            return res.json({ message: "API key was already revoked." });
        }
        await LogService.generate(
            res.locals!.user!.id,
            `Revoked API key: **${result.apiKey.name}** (admin)`,
            "api_key"
        );
        await new WebhookBuilder()
            .addEmbed(
                new EmbedBuilder()
                    .setAuthor(DiscordUtils.defaultWebhookAuthor(req.session))
                    .setColor(DiscordUtils.webhookColors.darkRed)
                    .setDescription(`Revoked API key: **${result.apiKey.name}**`)
                    .addField("Owner", `[${result.apiKey.user.username}](${result.apiKey.user.osuProfileUrl})`, true)
                    .setFooter("admin action")
            )
            .setLocation("dev")
            .send();
        return res.json({ message: "API key revoked!" });
    }

    /** GET all API keys */
    public async getAll(req: Request, res: Response) {
        const apiKeys = await ApiKeyService.getAllKeys();
        return res.json({ apiKeys });
    }
}

export default new ApiKeysController();
