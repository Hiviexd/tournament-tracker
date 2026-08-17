import axios from "axios";
import { INotificationJob, IOsuAnnouncementPayload, NotificationJobPayload } from "@tc/types/NotificationJob";
import OsuBotService from "../OsuBotService";
import OsuApiService from "../OsuApiService";
import { NotificationDispatchResult } from "../NotificationDispatchService";

function isOsuPayload(payload: NotificationJobPayload): payload is IOsuAnnouncementPayload {
    return "userIds" in payload;
}

class OsuSender {
    public async send(job: Pick<INotificationJob, "payload">): Promise<NotificationDispatchResult> {
        const payload = job.payload;
        if (!isOsuPayload(payload)) {
            return { ok: false, retryable: false, error: "Invalid osu announcement payload" };
        }

        try {
            const result = await OsuBotService.sendAnnouncementDirect(
                payload.userIds,
                payload.message,
                payload.fallbackId,
            );

            if (OsuApiService.isOsuResponseError(result)) {
                const statusCode = result.statusCode;
                return {
                    ok: false,
                    retryable: statusCode === undefined || statusCode === 429 || statusCode >= 500,
                    statusCode,
                    error: result.error || "osu announcement failed",
                };
            }

            payload.sentTo = result.sentTo;
            return { ok: true, retryable: false, statusCode: 200 };
        } catch (error: any) {
            const statusCode = axios.isAxiosError(error) ? error.response?.status : error?.statusCode;
            return {
                ok: false,
                retryable: true,
                statusCode,
                error: error?.message || "Failed to send osu announcement",
            };
        }
    }
}

export default new OsuSender();
