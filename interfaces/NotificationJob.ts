import { Document } from "mongoose";
import { IDiscordEmbed } from "./Discord";
import { IOsuBotMessage } from "./OsuApi";

export type NotificationProvider = "discord" | "osu";
export type NotificationJobStatus = "pending" | "processing" | "sent" | "failed";

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
