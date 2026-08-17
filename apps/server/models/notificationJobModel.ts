import mongoose, { Schema } from "mongoose";
import { INotificationJob } from "@tc/types/NotificationJob";

const NotificationJobSchema = new Schema<INotificationJob>(
    {
        provider: { type: String, enum: ["discord", "osu"], required: true },
        kind: { type: String, required: true },
        meta: { type: Schema.Types.Mixed },
        payload: { type: Schema.Types.Mixed, required: true },
        status: { type: String, enum: ["pending", "processing", "sent", "failed"], default: "pending", required: true },
        attempts: { type: Number, default: 0, min: 0 },
        maxAttempts: { type: Number, default: 6, min: 1 },
        nextAttemptAt: { type: Date, default: () => new Date(), required: true },
        lockedAt: { type: Date, default: null },
        lastAttemptAt: { type: Date, default: null },
        sentAt: { type: Date, default: null },
        lastError: { type: String, default: null },
        lastHttpStatus: { type: Number, default: null },
        processingBy: { type: String, default: null },
    },
    { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

NotificationJobSchema.index({ status: 1, nextAttemptAt: 1, createdAt: 1 });
NotificationJobSchema.index({ provider: 1, status: 1, nextAttemptAt: 1 });
NotificationJobSchema.index({ status: 1, updatedAt: -1 });

const NotificationJob = mongoose.model<INotificationJob>("NotificationJob", NotificationJobSchema);

export default NotificationJob;
