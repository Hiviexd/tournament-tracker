import { IDiscordEmbed } from "@tc/types/Discord";
import { DiscordRoleName, DiscordWebhookLocation, IDiscordNotificationPayload } from "@tc/types/NotificationJob";
import { EmbedBuilder } from "./EmbedBuilder";
import NotificationDispatchService from "../NotificationDispatchService";

/**
 * Builder class for configuring and sending Discord webhooks with a fluent API
 */
export class WebhookBuilder {
    private embeds: IDiscordEmbed[] = [];
    private location: DiscordWebhookLocation = "main";
    private threadId?: string;
    private notification: "silent" | "normal" = "normal";
    private users: string[] = [];
    private roles: DiscordRoleName[] = [];
    private message: string = "";
    private wait = false;
    private editMessageId?: string;

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
     * Set the webhook location (`main`, `dev`, or `news` channels)
     * Default is `main`
     */
    public setLocation(location: DiscordWebhookLocation): this {
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
    public addRoles(roles: DiscordRoleName[]): this {
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
     * Wait for Discord to confirm the send and return the created message (`?wait=true`).
     */
    public waitForMessage(): this {
        this.wait = true;
        return this;
    }

    /**
     * Edit a previously sent webhook message instead of creating a new one.
     */
    public editMessage(messageId: string): this {
        this.editMessageId = messageId;
        return this;
    }

    public toPayload(): IDiscordNotificationPayload {
        const payload: IDiscordNotificationPayload = {
            location: this.location,
            threadId: this.threadId,
            notification: this.notification,
            users: this.users,
            roles: this.roles,
            message: this.message,
            embeds: this.embeds,
        };

        if (this.wait) {
            payload.wait = true;
        }

        if (this.editMessageId) {
            payload.editMessageId = this.editMessageId;
        }

        return payload;
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
