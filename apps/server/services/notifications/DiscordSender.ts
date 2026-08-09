import axios from "axios";
import config from "@tc/config";
import { IDiscordNotificationPayload, INotificationJob, NotificationJobPayload } from "@tc/types/NotificationJob";
import { NotificationDispatchResult } from "../NotificationDispatchService";

class DiscordSender {
    private getWebhookLink(location: "main" | "dev", threadId?: string): string {
        let url = `https://discord.com/api/webhooks/${config.discord.webhooks[location].id}/${config.discord.webhooks[location].token}`;

        // In development, always post to channel root (no thread_id) for easier visibility.
        const shouldAppendThreadId = process.env.NODE_ENV !== "development";
        if (threadId && shouldAppendThreadId) {
            url += `?thread_id=${threadId}`;
        }
        return url;
    }

    private buildContent(payload: IDiscordNotificationPayload): string {
        const users = payload.users || [];
        const roles = payload.roles || [];
        const message = payload.message || "";

        const userPings = users
            .map((id) => `<@${id}>`)
            .join(" ")
            .trim();
        const rolePings = roles
            .map((role) => `<@&${config.discord.roles[role]}>`)
            .join(" ")
            .trim();

        return `${rolePings} ${userPings} ${message}`.trim();
    }

    public async send(job: INotificationJob): Promise<NotificationDispatchResult> {
        const payload = job.payload as NotificationJobPayload;
        const discordPayload = payload as IDiscordNotificationPayload;

        try {
            const webhookUrl = this.getWebhookLink(discordPayload.location, discordPayload.threadId);
            await axios.post(webhookUrl, {
                username: config.discord.username,
                avatar_url: config.discord.avatar_url,
                embeds: discordPayload.embeds,
                content: this.buildContent(discordPayload),
                flags: discordPayload.notification === "silent" ? 1 << 12 : undefined,
            });

            return { ok: true, retryable: false };
        } catch (error: any) {
            const statusCode = error?.response?.status as number | undefined;
            const errorMessage = error?.response?.data?.message || error?.message || "Discord webhook request failed";

            return {
                ok: false,
                retryable: statusCode === 429 || statusCode === undefined || statusCode >= 500,
                statusCode,
                error: String(errorMessage),
            };
        }
    }
}

export default new DiscordSender();
