import NotificationJob from "../models/notificationJobModel";
import {
    IDiscordNotificationPayload,
    INotificationJob,
    INotificationRuntimeStats,
    IOsuAnnouncementPayload,
    NotificationProvider,
} from "@tc/types/NotificationJob";

const DEFAULT_MAX_ATTEMPTS = 6;
const DEFAULT_BASE_DELAY_MS = 2_000;
const DEFAULT_MAX_DELAY_MS = 5 * 60_000;

export interface NotificationDispatchResult {
    ok: boolean;
    retryable: boolean;
    error?: string;
    statusCode?: number;
}

class NotificationDispatchService {
    private runtimeCounters: INotificationRuntimeStats = {
        enqueued: 0,
        sent: 0,
        retried: 0,
        failed: 0,
    };

    public async enqueueDiscordWebhook(
        payload: IDiscordNotificationPayload,
        kind: string = "discord.webhook",
    ): Promise<INotificationJob> {
        return await this.enqueue("discord", kind, payload);
    }

    public async enqueueOsuAnnouncement(
        payload: IOsuAnnouncementPayload,
        kind: string = "osu.announcement",
    ): Promise<INotificationJob> {
        return await this.enqueue("osu", kind, payload);
    }

    private async enqueue(
        provider: NotificationProvider,
        kind: string,
        payload: IDiscordNotificationPayload | IOsuAnnouncementPayload,
    ): Promise<INotificationJob> {
        const job = await NotificationJob.create({
            provider,
            kind,
            payload,
            status: "pending",
            attempts: 0,
            maxAttempts: DEFAULT_MAX_ATTEMPTS,
            nextAttemptAt: new Date(),
        });

        this.runtimeCounters.enqueued += 1;
        return job;
    }

    public async claimNextJobs(limit: number, processingBy: string): Promise<INotificationJob[]> {
        const claimedJobs: INotificationJob[] = [];

        for (let i = 0; i < limit; i += 1) {
            const job = await NotificationJob.findOneAndUpdate(
                {
                    status: "pending",
                    nextAttemptAt: { $lte: new Date() },
                },
                {
                    $set: {
                        status: "processing",
                        lockedAt: new Date(),
                        processingBy,
                        lastAttemptAt: new Date(),
                    },
                    $inc: { attempts: 1 },
                },
                {
                    sort: { nextAttemptAt: 1, createdAt: 1 },
                    new: true,
                },
            );

            if (!job) break;
            claimedJobs.push(job);
        }

        return claimedJobs;
    }

    public async requeueStaleProcessingJobs(staleAfterMs: number): Promise<number> {
        const staleBefore = new Date(Date.now() - staleAfterMs);
        const result = await NotificationJob.updateMany(
            {
                status: "processing",
                lockedAt: { $lt: staleBefore },
            },
            {
                $set: {
                    status: "pending",
                    nextAttemptAt: new Date(),
                    lockedAt: null,
                    processingBy: null,
                },
            },
        );

        return result.modifiedCount;
    }

    public async markSent(jobId: string): Promise<void> {
        await NotificationJob.findByIdAndUpdate(jobId, {
            $set: {
                status: "sent",
                sentAt: new Date(),
                lockedAt: null,
                processingBy: null,
                lastError: null,
                lastHttpStatus: null,
            },
        });
        this.runtimeCounters.sent += 1;
    }

    public async markFailed(jobId: string, error: string, statusCode?: number): Promise<void> {
        await NotificationJob.findByIdAndUpdate(jobId, {
            $set: {
                status: "failed",
                lockedAt: null,
                processingBy: null,
                lastError: error,
                lastHttpStatus: statusCode ?? null,
            },
        });
        this.runtimeCounters.failed += 1;
    }

    public async scheduleRetry(job: INotificationJob, error: string, statusCode?: number): Promise<void> {
        const delayMs = this.calculateBackoffDelayMs(job.attempts);
        const nextAttemptAt = new Date(Date.now() + delayMs);

        await NotificationJob.findByIdAndUpdate(job._id, {
            $set: {
                status: "pending",
                nextAttemptAt,
                lockedAt: null,
                processingBy: null,
                lastError: error,
                lastHttpStatus: statusCode ?? null,
                payload: job.payload,
            },
        });
        this.runtimeCounters.retried += 1;
    }

    public calculateBackoffDelayMs(
        attempt: number,
        baseDelayMs: number = DEFAULT_BASE_DELAY_MS,
        maxDelayMs: number = DEFAULT_MAX_DELAY_MS,
    ): number {
        const exponentialDelay = Math.min(maxDelayMs, baseDelayMs * 2 ** Math.max(0, attempt - 1));
        const jitter = Math.floor(Math.random() * (baseDelayMs * 0.5));
        return Math.min(maxDelayMs, exponentialDelay + jitter);
    }

    public shouldRetry(result: NotificationDispatchResult): boolean {
        if (result.retryable) return true;
        if (result.statusCode === 429) return true;
        if (result.statusCode !== undefined && result.statusCode >= 500) return true;
        return false;
    }

    public async getQueueStats(): Promise<{
        pending: number;
        processing: number;
        sent: number;
        failed: number;
    }> {
        const [pending, processing, sent, failed] = await Promise.all([
            NotificationJob.countDocuments({ status: "pending" }),
            NotificationJob.countDocuments({ status: "processing" }),
            NotificationJob.countDocuments({ status: "sent" }),
            NotificationJob.countDocuments({ status: "failed" }),
        ]);

        return { pending, processing, sent, failed };
    }

    public getRuntimeCounters(): INotificationRuntimeStats {
        return { ...this.runtimeCounters };
    }
}

export default new NotificationDispatchService();
