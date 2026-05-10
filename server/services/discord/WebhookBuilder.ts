import { IDiscordEmbed } from "../../../interfaces/Discord";
import { IDiscordNotificationPayload } from "../../../interfaces/NotificationJob";
import { EmbedBuilder } from "./EmbedBuilder";
import NotificationDispatchService from "../NotificationDispatchService";

/**
 * Builder class for configuring and sending Discord webhooks with a fluent API
 */
export class WebhookBuilder {
    private embeds: IDiscordEmbed[] = [];
    private location: "main" | "dev" = "main";
    private threadId?: string;
    private notification: "silent" | "normal" = "normal";
    private users: string[] = [];
    private roles: string[] = [];
    private message: string = "";

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

    private toPayload(): IDiscordNotificationPayload {
        return {
            location: this.location,
            threadId: this.threadId,
            notification: this.notification,
            users: this.users,
            roles: this.roles as ("tournament" | "contest")[],
            message: this.message,
            embeds: this.embeds,
        };
    }

    /**
     * Send the webhook
     */
    public async send(): Promise<void> {
        if (this.embeds.length === 0) {
            throw new Error("At least one embed is required");
        }

        try {
            await NotificationDispatchService.enqueueDiscordWebhook(this.toPayload());
        } catch (error) {
            console.error("Failed to enqueue Discord webhook job:", error);
        }
    }
}
