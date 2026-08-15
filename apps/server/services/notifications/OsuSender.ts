import { INotificationJob, IOsuAnnouncementPayload, NotificationJobPayload } from "@tc/types/NotificationJob";
import OsuBotService from "../OsuBotService";
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

            if (result === true) {
                return { ok: true, retryable: false };
            }

            const statusCode = result.statusCode;
            return {
                ok: false,
                retryable: statusCode === undefined || statusCode === 429 || statusCode >= 500,
                statusCode,
                error: result.error || "osu announcement failed",
            };
        } catch (error: any) {
            return {
                ok: false,
                retryable: true,
                error: error?.message || "Failed to send osu announcement",
            };
        }
    }
}

export default new OsuSender();
