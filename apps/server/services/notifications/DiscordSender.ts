import axios from "axios";
import config from "@tc/config";
import {
    DiscordWebhookLocation,
    IDiscordNotificationPayload,
    INotificationJob,
    NotificationJobPayload,
} from "@tc/types/NotificationJob";
import { isNumber, isPlainObject, isString } from "@tc/utils/common";
import { NotificationDispatchResult } from "../NotificationDispatchService";

function isDiscordPayload(payload: NotificationJobPayload): payload is IDiscordNotificationPayload {
    return "embeds" in payload;
}

class DiscordSender {
    private getWebhookLink(location: DiscordWebhookLocation, threadId?: string): string {
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

    public async send(job: Pick<INotificationJob, "payload">): Promise<NotificationDispatchResult> {
        const payload = job.payload;
        if (!isDiscordPayload(payload)) {
            return { ok: false, retryable: false, error: "Invalid Discord webhook payload" };
        }

        try {
            const webhookUrl = this.getWebhookLink(payload.location, payload.threadId);
            const response = await axios.post(webhookUrl, {
                username: config.discord.username,
                avatar_url: config.discord.avatar_url,
                embeds: payload.embeds,
                content: this.buildContent(payload),
                flags: payload.notification === "silent" ? 1 << 12 : undefined,
            });

            return { ok: true, retryable: false, statusCode: isNumber(response.status) ? response.status : 204 };
        } catch (error: unknown) {
            const response = axios.isAxiosError(error)
                ? error.response
                : isPlainObject(error)
                  ? error.response
                  : undefined;
            const statusCode = isNumber(response?.status) ? response.status : undefined;
            const responseData = response?.data;
            const errorMessage =
                (isPlainObject(responseData) && isString(responseData.message) && responseData.message) ||
                (error instanceof Error && error.message) ||
                (isPlainObject(error) && isString(error.message) && error.message) ||
                "Discord webhook request failed";

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
