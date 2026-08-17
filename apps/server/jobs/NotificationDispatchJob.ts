import BaseJob from "./BaseJob";
import NotificationDispatchService from "../services/NotificationDispatchService";
import DiscordSender from "../services/notifications/DiscordSender";
import OsuSender from "../services/notifications/OsuSender";
import { INotificationJob } from "@tc/types/NotificationJob";
import DiscordUtils from "../services/discord/DiscordUtils";

const STALE_PROCESSING_TIMEOUT_MS = 5 * 60_000;
const DEFAULT_CLAIM_LIMIT = 1;
const STALE_SWEEP_INTERVAL_MS = 60_000;

type DispatchCounters = {
    sent: number;
    retried: number;
    failed: number;
};

export default class NotificationDispatchJob extends BaseJob {
    name = "NotificationDispatch";
    schedule = "*/1 * * * * *";
    private isRunning = false;
    private lastStaleSweepAt = 0;

    private getClaimLimit(): number {
        const raw = process.env.NOTIFICATION_CLAIM_LIMIT;
        if (!raw) return DEFAULT_CLAIM_LIMIT;
        const parsed = parseInt(raw, 10);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_CLAIM_LIMIT;
    }

    private async processJob(job: INotificationJob, counters: DispatchCounters): Promise<void> {
        let result;
        switch (job.provider) {
            case "discord":
                result = await DiscordSender.send(job);
                break;
            case "osu":
                result = await OsuSender.send(job);
                break;
            default:
                result = {
                    ok: false,
                    retryable: false,
                    error: `Unsupported provider "${job.provider}"`,
                };
                break;
        }

        if (result.ok) {
            await NotificationDispatchService.markSent(job.id, result.statusCode, job.payload);
            counters.sent += 1;
            return;
        }

        const canRetry = NotificationDispatchService.shouldRetry(result);
        const attemptsExhausted = job.attempts >= job.maxAttempts;

        if (canRetry && !attemptsExhausted) {
            await NotificationDispatchService.scheduleRetry(
                job,
                result.error || "Provider request failed",
                result.statusCode,
            );
            counters.retried += 1;
            return;
        }

        await NotificationDispatchService.markFailed(
            job.id,
            result.error || "Provider request failed",
            result.statusCode,
        );
        await DiscordUtils.sendErrorWebhook(
            {
                message: result.error || "Provider request failed",
                code: result.statusCode || "N/A",
                stack: [
                    `Notification dispatch failed permanently`,
                    `jobId=${job.id}`,
                    `provider=${job.provider}`,
                    `kind=${job.kind}`,
                    `attempts=${job.attempts}/${job.maxAttempts}`,
                    `statusCode=${result.statusCode ?? "N/A"}`,
                    `error=${result.error || "Unknown error"}`,
                ].join("\n"),
                response: { data: { message: result.error || "Provider request failed" } },
            },
            {
                message: `Notification job failed: ${job.provider}.${job.kind}`,
                embeds: [],
            },
            job.provider,
        );
        counters.failed += 1;
    }

    protected async execute(): Promise<void> {
        if (this.isRunning) {
            this.log("Skipped tick: previous notification batch still running");
            return;
        }
        this.isRunning = true;

        try {
            const processingBy = `${process.pid}:${Date.now()}`;
            const claimLimit = this.getClaimLimit();

            const now = Date.now();
            if (now - this.lastStaleSweepAt >= STALE_SWEEP_INTERVAL_MS) {
                const reclaimed =
                    await NotificationDispatchService.requeueStaleProcessingJobs(STALE_PROCESSING_TIMEOUT_MS);
                if (reclaimed > 0) {
                    this.log(`Re-queued ${reclaimed} stale processing job(s)`);
                }
                this.lastStaleSweepAt = now;
            }

            const jobs = await NotificationDispatchService.claimNextJobs(claimLimit, processingBy);
            if (jobs.length === 0) {
                this.setSuccessMessage("No pending notification jobs");
                return;
            }

            const counters: DispatchCounters = { sent: 0, retried: 0, failed: 0 };
            await Promise.all(jobs.map((job) => this.processJob(job, counters)));

            this.setSuccessMessage(
                `Processed ${jobs.length} notification job(s): sent=${counters.sent}, retried=${counters.retried}, failed=${counters.failed}`,
            );
        } finally {
            this.isRunning = false;
        }
    }
}
