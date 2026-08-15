import { Document } from "mongoose";
import { IDiscordEmbed } from "./Discord";
import { IOsuBotMessage } from "./OsuApi";

export const NOTIFICATION_PROVIDERS = ["discord", "osu"] as const;
export type NotificationProvider = (typeof NOTIFICATION_PROVIDERS)[number];

export const NOTIFICATION_JOB_STATUSES = ["pending", "processing", "sent", "failed"] as const;
export type NotificationJobStatus = (typeof NOTIFICATION_JOB_STATUSES)[number];

export interface IDiscordNotificationPayload {
    location: "main" | "dev";
    embeds: IDiscordEmbed[];
    threadId?: string;
    notification?: "silent" | "normal";
    users?: string[];
    roles?: ("tournament" | "contest")[];
    message?: string;
}

export interface IOsuAnnouncementPayload {
    userIds: number[];
    message: IOsuBotMessage;
    fallbackId?: number;
}

export type NotificationJobPayload = IDiscordNotificationPayload | IOsuAnnouncementPayload;

export interface INotificationJob extends Document {
    provider: NotificationProvider;
    kind: string;
    payload: NotificationJobPayload;
    status: NotificationJobStatus;
    attempts: number;
    maxAttempts: number;
    nextAttemptAt: Date;
    lockedAt?: Date;
    lastAttemptAt?: Date;
    sentAt?: Date;
    lastError?: string;
    lastHttpStatus?: number;
    processingBy?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface INotificationQueueStats {
    pending: number;
    processing: number;
    sent: number;
    failed: number;
}

export interface INotificationRuntimeStats {
    enqueued: number;
    sent: number;
    retried: number;
    failed: number;
}

export interface INotificationStatsResponse {
    queue: INotificationQueueStats;
    runtime: INotificationRuntimeStats;
}

export interface INotificationJobListItem {
    _id: string;
    id?: string;
    provider: NotificationProvider;
    kind: string;
    status: NotificationJobStatus;
    attempts: number;
    maxAttempts: number;
    lastError: string | null;
    lastHttpStatus: number | null;
    payload: NotificationJobPayload;
    createdAt: string;
    updatedAt: string;
}

export interface INotificationJobsListQuery {
    page?: number;
    status?: NotificationJobStatus | "";
    provider?: NotificationProvider | "";
    kind?: string;
    payload?: string;
}

export interface INotificationJobsListResponse {
    jobs: INotificationJobListItem[];
    total: number;
    page: number;
    pages: number;
    limit: number;
}
