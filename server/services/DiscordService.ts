import axios from "axios";
import config from "../../config.json";
import { IDiscordEmbed } from "../../interfaces/Discord";
import helpers from "../helpers";
import webhookColors from "../helpers/constants/webhookColors";

class DiscordService {
    /** * Constructs a webhook link */
    private getWebhookLink(webhookType?: string, threadId?: string): string {
        let url = `https://discord.com/api/webhooks/`;
        const type = webhookType || "main";

        url += `${config.discord.webhooks[type].id}/${config.discord.webhooks[type].token}`;

        if (threadId) {
            url += `?thread_id=${threadId}`;
        }

        return url;
    }

    /** * Construts a webhook author from the current user */
    public defaultWebhookAuthor(session: any) {
        return {
            name: session.username,
            icon_url: `https://a.ppy.sh/${session.osuId}`,
            url: `https://osu.ppy.sh/users/${session.osuId}`,
        };
    }

    /**
     * * Sends a webhook
     * @param embeds Array of embed objects
     * @param message Optional essage to include with embed
     * @param threadId Optional ID of the thread to send the message to
     * @param webhook Optional destination of the webhook (defaults to `mainWebhook`)
     */
    public async sendWebhook(
        embeds: IDiscordEmbed[],
        message?: string,
        threadId?: string,
        webhook?: string
    ) {
        const url = this.getWebhookLink(webhook, threadId);

        try {
            await axios.post(url, {
                username: config.discord.username,
                avatar_url: config.discord.avatar_url,
                embeds,
                content: message || "",
            });
        } catch (error) {
            this.sendErrorWebhook(error, { message, embeds }, webhook);
        }
    }

    /**
     * * Sends a webhook with user pings
     * @param users Array of Discord user IDs to ping
     * @param embeds Array of embed objects
     * @param message Optional essage to include with embed
     * @param threadId Optional ID of the thread to send the message to
     * @param webhook Optional destination of the webhook (defaults to `mainWebhook`)
     */
    public async sendUserHighlightWebhook(
        users: string[],
        embeds: IDiscordEmbed[],
        message?: string,
        threadId?: string,
        webhook?: string
    ) {
        const url = this.getWebhookLink(webhook, threadId);
        let pings = "";

        for (const discordId of users) {
            pings += `<@${discordId}> `;
        }

        try {
            await axios.post(url, {
                username: config.discord.username,
                avatar_url: config.discord.avatar_url,
                embeds,
                content: `${pings} ${message || ""}`,
            });
        } catch (error) {
            this.sendErrorWebhook(error, { message, embeds }, webhook);
        }
    }

    /**
     * * Sends a webhook with role pings
     * @param roles Array of role types to ping
     * @param embeds Array of embed objects
     * @param message Optional essage to include with embed
     * @param threadId Optional ID of the thread to send the message to
     * @param webhook Optional destination of the webhook (defaults to `mainWebhook`)
     */
    public async sendRoleHighlightWebhook(
        roles: string[],
        embeds: IDiscordEmbed[],
        message?: string,
        threadId?: string,
        webhook?: string
    ) {
        const url = this.getWebhookLink(webhook, threadId);
        let pings = "";

        for (const role of roles) {
            pings += `<@&${config.discord.roles[role]}> `;
        }

        try {
            await axios.post(url, {
                username: config.discord.username,
                avatar_url: config.discord.avatar_url,
                embeds,
                content: `${pings} ${message || ""}`,
            });
        } catch (error) {
            this.sendErrorWebhook(error, { message, embeds }, webhook);
        }
    }

    private async sendErrorWebhook(
        error: any,
        embedInfo: { message?: string; embeds: IDiscordEmbed[] },
        webhookType?: string
    ) {
        const url = this.getWebhookLink("dev");
        const { message, embeds } = embedInfo;

        let webhookAuthor = {};

        // get webhook author from the first embed that has an author
        for (const embed of embeds) {
            if (embed.author) {
                webhookAuthor = embed.author;
                break;
            }
        }

        const fields = [
            {
                name: "webhook",
                value: `\`${webhookType || "main"}\``,
            },
            {
                name: "message",
                value: helpers.shorten(`\`\`\`${message}\`\`\``, 1024),
            },
            {
                name: "embeds",
                value: helpers.shorten(`\`\`\`${JSON.stringify(embeds, null, 2)}\`\`\``, 1024),
            },
        ];

        const embed = [
            {
                author: webhookAuthor,
                color: webhookColors.red,
                title: "❌ Embed error",
                description: "```" + helpers.shorten(error.stack, 2000) + "```",
                fields,
                timestamp: new Date(),
            },
        ];

        try {
            await axios.post(url, {
                username: config.discord.username,
                avatar_url: config.discord.avatar_url,
                embeds: embed,
            });
        } catch (error) {
            // ¯\_(ツ)_/¯
            console.error(error);
        }
    }
}

export default new DiscordService();
