import axios from "axios";
import config from "../../../config.json";
import { IDiscordEmbed } from "../../../interfaces/Discord";
import utils from "../../../utils";
import { EmbedBuilder } from "./EmbedBuilder";
import DiscordUtils from "./DiscordUtils";

/**
 * Builder class for configuring and sending Discord webhooks with a fluent API
 */
export class WebhookBuilder {
    private embeds: IDiscordEmbed[] = [];
    private location: "main" | "dev" = "main";
    private threadId?: string;
    private notification?: "silent" | "normal" = "normal";
    private users: string[] = [];
    private roles: string[] = [];
    private message?: string = "";

    /**
     * Add an embed to the webhook (accepts EmbedBuilder or IDiscordEmbed)
     */
    public addEmbed(embed: EmbedBuilder | IDiscordEmbed): this {
        if (embed instanceof EmbedBuilder) {
            this.embeds.push(embed.build());
        } else {
            this.embeds.push(embed);
        }
        return this;
    }

    /**
     * Set the webhook location (`main` or `dev` channels)
     * Default is `main`
     */
    public setLocation(location: "main" | "dev"): this {
        this.location = location;
        return this;
    }

    /**
     * Set the thread ID for threaded webhooks
     */
    public setThreadId(threadId: string): this {
        this.threadId = threadId;
        return this;
    }

    /**
     * Set the notification type (`silent` or `normal`)
     * Default is `normal`
     */
    public setNotification(type: "silent" | "normal"): this {
        this.notification = type;
        return this;
    }

    /**
     * Add users to ping before the message
     */
    public addUsers(discordIds: string[]): this {
        this.users.push(...discordIds);
        return this;
    }

    /**
     * Add roles to ping before the message
     */
    public addRoles(roles: ("tournament" | "contest")[]): this {
        this.roles.push(...roles);
        return this;
    }

    /**
     * Set the webhook message content
     */
    public setMessage(message: string): this {
        this.message = message;
        return this;
    }

    /**
     * Constructs a webhook link
     */
    private getWebhookLink(webhookType?: string, threadId?: string): string {
        let url = `https://discord.com/api/webhooks/`;
        const type = webhookType || "main";

        url += `${config.discord.webhooks[type].id}/${config.discord.webhooks[type].token}`;

        if (threadId) {
            url += `?thread_id=${threadId}`;
        }

        return url;
    }

    /**
     * Send the webhook
     */
    public async send(): Promise<void> {
        if (this.embeds.length === 0) {
            throw new Error("At least one embed is required");
        }

        const url = this.getWebhookLink(this.location, this.threadId);

        let userPings = "";
        let rolePings = "";
        let content = "";

        if (this.users.length > 0) {
            userPings = this.users
                .map((id) => `<@${id}>`)
                .join(" ")
                .trim();
        }

        if (this.roles.length > 0) {
            rolePings = this.roles
                .map((role) => `<@&${config.discord.roles[role]}>`)
                .join(" ")
                .trim();
        }

        content = `${rolePings} ${userPings} ${this.message}`.trim();

        try {
            await axios.post(url, {
                username: config.discord.username,
                avatar_url: config.discord.avatar_url,
                embeds: this.embeds,
                content,
                flags: this.notification === "silent" ? 1 << 12 : undefined,
            });
            await utils.delay(1000);
        } catch (error) {
            await DiscordUtils.sendErrorWebhook(
                error,
                { message: this.message, embeds: this.embeds },
                this.location,
                this.threadId
            );
        }
    }
}
