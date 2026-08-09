import { Request, Response } from "express";
import NotificationDispatchService from "../services/NotificationDispatchService";
import NotificationJob from "../models/notificationJobModel";

class DevController {
    private static readonly NOTIFICATION_LISTING_LIMIT = 30;

    public getSession(req: Request, res: Response) {
        res.json({
            mongoId: req.session.mongoId,
            osuId: req.session.osuId,
            username: req.session.username,
        });
    }

    public updateSession(req: Request, res: Response) {
        req.session.mongoId = req.body.mongoId;
        req.session.osuId = req.body.osuId;
        req.session.username = req.body.username;

        req.session.save();

        res.json({ message: "Session updated successfully! Refresh to see changes." });
    }

    public async getNotificationQueueStats(req: Request, res: Response) {
        const [queueStats, runtimeCounters] = await Promise.all([
            NotificationDispatchService.getQueueStats(),
            Promise.resolve(NotificationDispatchService.getRuntimeCounters()),
        ]);

        res.json({
            queue: queueStats,
            runtime: runtimeCounters,
        });
    }

    public async getNotificationJobsListing(req: Request, res: Response) {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = DevController.NOTIFICATION_LISTING_LIMIT;
        const status = typeof req.query.status === "string" ? req.query.status.trim() : "";
        const provider = typeof req.query.provider === "string" ? req.query.provider.trim() : "";
        const kind = typeof req.query.kind === "string" ? req.query.kind.trim() : "";
        const payload = typeof req.query.payload === "string" ? req.query.payload.trim() : "";

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

        res.json({
            jobs,
            total,
            page,
            pages: Math.max(1, Math.ceil(total / limit)),
            limit,
        });
    }
}

export default new DevController();
