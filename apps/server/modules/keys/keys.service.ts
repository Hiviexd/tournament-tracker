import {
    BadRequestException,
    HttpException,
    Injectable,
    NotFoundException,
} from "@nestjs/common";
import type { Session } from "express-session";
import ApiKeyService from "../../services/ApiKeyService";
import { AvailableApiScopes, type ApiScope } from "@tc/types/ApiKey";
import LogService from "@tc/models/LogService";
import { EmbedBuilder } from "@tc/notifications/discord/EmbedBuilder";
import { WebhookBuilder } from "@tc/notifications/discord/WebhookBuilder";
import DiscordUtils from "@tc/notifications/discord/DiscordUtils";
import type { IUser } from "@tc/types/User";

function rethrowApiKeyError(err: unknown): never {
    if (err && typeof err === "object" && "status" in err) {
        const e = err as Error & { status: number };
        throw new HttpException(e.message || "API key error", e.status);
    }
    throw err;
}

@Injectable()
export class KeysService {
    async get(user: IUser) {
        const apiKey = await ApiKeyService.getForUser(user);
        return { apiKey: apiKey ? { ...apiKey.toObject(), hashedKey: undefined } : null };
    }

    async getAll() {
        const apiKeys = await ApiKeyService.getAllKeys();
        return { apiKeys };
    }

    async create(
        body: { name?: string; scopes?: ApiScope[]; isElevated?: boolean },
        user: IUser,
        session: Session,
    ) {
        const { name, scopes, isElevated } = body || {};

        if (!name) {
            throw new BadRequestException("Name is required");
        }

        if (!scopes?.every((scope) => Object.values(AvailableApiScopes).includes(scope as AvailableApiScopes))) {
            throw new BadRequestException("Invalid scopes");
        }

        try {
            const { rawKey, apiKey } = await ApiKeyService.createKey(user, {
                name: String(name),
                scopes,
                isElevated: !!isElevated,
            });

            await LogService.generate(user.id, `Created API key: **${apiKey.name}**`, "api_key");

            await new WebhookBuilder()
                .addEmbed(
                    new EmbedBuilder()
                        .setAuthor(DiscordUtils.defaultWebhookAuthor(session))
                        .setColor(DiscordUtils.webhookColors.white)
                        .setDescription(`Created new API key: **${apiKey.name}**`),
                )
                .setLocation("dev")
                .send();

            return {
                message: "API key created!",
                key: rawKey,
                apiKey: { ...apiKey.toObject(), hashedKey: undefined },
            };
        } catch (err) {
            rethrowApiKeyError(err);
        }
    }

    async update(body: { scopes?: ApiScope[] }, user: IUser, session: Session) {
        const { scopes } = body || {};

        if (!scopes?.every((scope) => Object.values(AvailableApiScopes).includes(scope as AvailableApiScopes))) {
            throw new BadRequestException("Invalid scopes");
        }

        try {
            const apiKey = await ApiKeyService.updateKey(user, { scopes });

            await LogService.generate(user.id, `Updated API key scopes: **${apiKey.name}**`, "api_key");

            await new WebhookBuilder()
                .addEmbed(
                    new EmbedBuilder()
                        .setAuthor(DiscordUtils.defaultWebhookAuthor(session))
                        .setColor(DiscordUtils.webhookColors.blue)
                        .setDescription(`Updated API key scopes: **${apiKey.name}**`)
                        .addField("New Scopes", scopes.map((scope) => `\`${scope}\``).join(", ")),
                )
                .setLocation("dev")
                .send();

            return { message: "API key scopes updated!", apiKey: { ...apiKey.toObject(), hashedKey: undefined } };
        } catch (err) {
            rethrowApiKeyError(err);
        }
    }

    async revoke(user: IUser, session: Session) {
        const result = await ApiKeyService.revokeKey(user);
        if (result.apiKey && !result.alreadyRevoked) {
            await LogService.generate(user.id, `Revoked API key: **${result.apiKey.name}**`, "api_key");
            await new WebhookBuilder()
                .addEmbed(
                    new EmbedBuilder()
                        .setAuthor(DiscordUtils.defaultWebhookAuthor(session))
                        .setColor(DiscordUtils.webhookColors.darkRed)
                        .setDescription(`Revoked API key: **${result.apiKey.name}**`),
                )
                .setLocation("dev")
                .send();
        }
        return { message: "API key revoked!" };
    }

    async revokeById(keyId: string | undefined, user: IUser, session: Session) {
        if (!keyId) {
            throw new BadRequestException("Key ID is required");
        }
        const result = await ApiKeyService.revokeKeyById(keyId);
        if (!result.apiKey) {
            throw new NotFoundException("API key not found");
        }
        if (result.alreadyRevoked) {
            return { message: "API key was already revoked." };
        }
        await LogService.generate(user.id, `Revoked API key: **${result.apiKey.name}** (admin)`, "api_key");
        await new WebhookBuilder()
            .addEmbed(
                new EmbedBuilder()
                    .setAuthor(DiscordUtils.defaultWebhookAuthor(session))
                    .setColor(DiscordUtils.webhookColors.darkRed)
                    .setDescription(`Revoked API key: **${result.apiKey.name}**`)
                    .addField("Owner", `[${result.apiKey.user.username}](${result.apiKey.user.osuProfileUrl})`, true)
                    .setFooter("admin action"),
            )
            .setLocation("dev")
            .send();
        return { message: "API key revoked!" };
    }
}
