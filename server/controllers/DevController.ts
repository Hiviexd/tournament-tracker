import { Request, Response } from "express";
import NotificationDispatchService from "../services/NotificationDispatchService";
import NotificationJob from "../models/notificationJobModel";

class DevController {
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

    public async getFailedNotificationJobs(req: Request, res: Response) {
        const limit = Math.min(Number(req.query.limit) || 25, 100);
        const jobs = await NotificationJob.find({ status: "failed" })
            .sort({ updatedAt: -1 })
            .limit(limit)
            .select("provider kind attempts maxAttempts lastError lastHttpStatus payload updatedAt createdAt");

        res.json({ jobs });
    }
}

export default new DevController();
