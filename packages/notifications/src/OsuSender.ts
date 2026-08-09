import { INotificationJob, IOsuAnnouncementPayload, NotificationJobPayload } from "@tc/types/NotificationJob";
import { ErrorResponse } from "@tc/types/Responses";
import OsuBotService from "@tc/osu/OsuBotService";
import { NotificationDispatchResult } from "./NotificationDispatchService";

class OsuSender {
    public async send(job: INotificationJob): Promise<NotificationDispatchResult> {
        const payload = job.payload as NotificationJobPayload;
        const osuPayload = payload as IOsuAnnouncementPayload;

        try {
            const result = await OsuBotService.sendAnnouncementDirect(
                osuPayload.userIds,
                osuPayload.message,
                osuPayload.fallbackId,
            );

            if (result === true) {
                return { ok: true, retryable: false };
            }

            const errorResult = result as ErrorResponse;
            const statusCode = errorResult.statusCode;
            return {
                ok: false,
                retryable: statusCode === undefined || statusCode === 429 || statusCode >= 500,
                statusCode,
                error: errorResult.error || "osu announcement failed",
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
