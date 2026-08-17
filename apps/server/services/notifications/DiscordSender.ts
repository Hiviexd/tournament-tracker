import axios from "axios";
import config from "@tc/config";
import { IDiscordNotificationPayload, INotificationJob, NotificationJobPayload } from "@tc/types/NotificationJob";
import { isNumber, isPlainObject, isString } from "@tc/utils/common";
import { NotificationDispatchResult } from "../NotificationDispatchService";

function isDiscordPayload(payload: NotificationJobPayload): payload is IDiscordNotificationPayload {
    return "embeds" in payload;
}

class DiscordSender {
    private getWebhookUrl(payload: IDiscordNotificationPayload): string {
        const webhook = config.discord.webhooks[payload.location];
        if (!webhook?.id || !webhook.token) {
            throw new Error(`Missing Discord webhook config for location "${payload.location}"`);
        }

        const base = `https://discord.com/api/v10/webhooks/${webhook.id}/${webhook.token}`;
        const url = payload.editMessageId ? `${base}/messages/${payload.editMessageId}` : base;
        const params = new URLSearchParams();

        if (payload.wait && !payload.editMessageId) {
            params.set("wait", "true");
        }

        // In development, always post to channel root (no thread_id) for easier visibility.
        if (payload.threadId && process.env.NODE_ENV !== "development") {
            params.set("thread_id", payload.threadId);
        }

        const query = params.toString();
        return query ? `${url}?${query}` : url;
    }

    private parseMessageId<T>(data: T): string | undefined {
        if (isPlainObject(data) && "id" in data && isString(data.id)) {
            return data.id;
        }
        return undefined;
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
            const webhookUrl = this.getWebhookUrl(payload);
            const flags = payload.notification === "silent" ? 1 << 12 : undefined;
            const headers = { "User-Agent": `DiscordBot (${config.baseUrl}, 1.0.0)` };
            const response = payload.editMessageId
                ? await axios.patch(
                      webhookUrl,
                      {
                          embeds: payload.embeds,
                          flags,
                      },
                      { headers },
                  )
                : await axios.post(
                      webhookUrl,
                      {
                          username: config.discord.username,
                          avatar_url: config.discord.avatar_url,
                          embeds: payload.embeds,
                          content: this.buildContent(payload),
                          flags,
                      },
                      { headers },
                  );

            return {
                ok: true,
                retryable: false,
                statusCode: isNumber(response.status) ? response.status : 204,
                messageId: this.parseMessageId(response.data),
            };
        } catch (error: unknown) {
            const response = axios.isAxiosError(error) ? error.response : undefined;
            const statusCode = isNumber(response?.status) ? response.status : undefined;
            const responseData = response?.data;
            const errorMessage =
                (isPlainObject(responseData) &&
                    "message" in responseData &&
                    isString(responseData.message) &&
                    responseData.message) ||
                (error instanceof Error && error.message) ||
                (isPlainObject(error) && "message" in error && isString(error.message) && error.message) ||
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
