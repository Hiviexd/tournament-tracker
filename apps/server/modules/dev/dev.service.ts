import { Injectable } from "@nestjs/common";
import type { Session } from "express-session";
import NotificationDispatchService from "@tc/notifications/NotificationDispatchService";
import NotificationJob from "@tc/models/notificationJobModel";

@Injectable()
export class DevService {
    private static readonly NOTIFICATION_LISTING_LIMIT = 30;

    getSession(session: Session) {
        return {
            mongoId: session.mongoId,
            osuId: session.osuId,
            username: session.username,
        };
    }

    updateSession(session: Session, body: { mongoId?: string; osuId?: number; username?: string }) {
        session.mongoId = body.mongoId;
        session.osuId = body.osuId;
        session.username = body.username;

        session.save();

        return { message: "Session updated successfully! Refresh to see changes." };
    }

    async getNotificationQueueStats() {
        const [queueStats, runtimeCounters] = await Promise.all([
            NotificationDispatchService.getQueueStats(),
            Promise.resolve(NotificationDispatchService.getRuntimeCounters()),
        ]);

        return {
            queue: queueStats,
            runtime: runtimeCounters,
        };
    }

    async getNotificationJobsListing(queryParams: {
        page?: string;
        status?: string;
        provider?: string;
        kind?: string;
        payload?: string;
    }) {
        const page = Math.max(1, Number(queryParams.page) || 1);
        const limit = DevService.NOTIFICATION_LISTING_LIMIT;
        const status = typeof queryParams.status === "string" ? queryParams.status.trim() : "";
        const provider = typeof queryParams.provider === "string" ? queryParams.provider.trim() : "";
        const kind = typeof queryParams.kind === "string" ? queryParams.kind.trim() : "";
        const payload = typeof queryParams.payload === "string" ? queryParams.payload.trim() : "";

        const query: Record<string, any> = {};
        if (status) query.status = status;
        if (provider) query.provider = provider;
        if (kind) query.kind = { $regex: kind, $options: "i" };

        const skip = (page - 1) * limit;
        const projection =
            "provider kind status attempts maxAttempts lastError lastHttpStatus payload updatedAt createdAt";

        let jobs: any[] = [];
        let total = 0;

        if (payload) {
            const payloadNeedle = payload.toLowerCase();
            const allFilteredJobs = await NotificationJob.find(query).sort({ updatedAt: -1 }).select(projection);
            const payloadMatchedJobs = allFilteredJobs.filter((job) =>
                JSON.stringify(job.payload || {})
                    .toLowerCase()
                    .includes(payloadNeedle),
            );

            total = payloadMatchedJobs.length;
            jobs = payloadMatchedJobs.slice(skip, skip + limit);
        } else {
            [jobs, total] = await Promise.all([
                NotificationJob.find(query).sort({ updatedAt: -1 }).skip(skip).limit(limit).select(projection),
                NotificationJob.countDocuments(query),
            ]);
        }

        return {
            jobs,
            total,
            page,
            pages: Math.max(1, Math.ceil(total / limit)),
            limit,
        };
    }
}
