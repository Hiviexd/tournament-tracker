import { describe, expect, it, vi } from "vitest";
import NotificationDispatchService from "../../services/NotificationDispatchService";
import NotificationJob from "../../models/notificationJobModel";

vi.mock("../../models/notificationJobModel", () => ({
    default: {
        findOneAndUpdate: vi.fn(),
        findByIdAndUpdate: vi.fn(),
        countDocuments: vi.fn(),
        create: vi.fn(),
    },
}));

interface MockNotificationJobModel {
    findByIdAndUpdate: ReturnType<typeof vi.fn>;
}

// SAFETY: vi.mock replaces the mongoose NotificationJob model with update stubs.
const mockNotificationJob = NotificationJob as MockNotificationJobModel;

describe("NotificationDispatchService", () => {
    it("calculates bounded exponential backoff with jitter", () => {
        const delay1 = NotificationDispatchService.calculateBackoffDelayMs(1, 1000, 16000);
        const delay2 = NotificationDispatchService.calculateBackoffDelayMs(2, 1000, 16000);
        const delay5 = NotificationDispatchService.calculateBackoffDelayMs(5, 1000, 16000);

        expect(delay1).toBeGreaterThanOrEqual(1000);
        expect(delay1).toBeLessThanOrEqual(1500);

        expect(delay2).toBeGreaterThanOrEqual(2000);
        expect(delay2).toBeLessThanOrEqual(2500);

        expect(delay5).toBeGreaterThanOrEqual(16000);
        expect(delay5).toBeLessThanOrEqual(16000);
    });

    it("marks retryable outcomes correctly", () => {
        expect(NotificationDispatchService.shouldRetry({ ok: false, retryable: true })).toBe(true);
        expect(NotificationDispatchService.shouldRetry({ ok: false, retryable: false, statusCode: 429 })).toBe(true);
        expect(NotificationDispatchService.shouldRetry({ ok: false, retryable: false, statusCode: 503 })).toBe(true);
        expect(NotificationDispatchService.shouldRetry({ ok: false, retryable: false, statusCode: 400 })).toBe(false);
    });

    it("requeues any job and resets attempts", async () => {
        const retriedJob = { id: "job-1", status: "pending", attempts: 0 };
        const orFail = vi.fn().mockResolvedValue(retriedJob);
        mockNotificationJob.findByIdAndUpdate.mockReturnValue({ orFail });

        const result = await NotificationDispatchService.retryJob("job-1");

        expect(result).toBe(retriedJob);
        expect(mockNotificationJob.findByIdAndUpdate).toHaveBeenCalledWith(
            "job-1",
            {
                $set: {
                    status: "pending",
                    nextAttemptAt: expect.any(Date),
                    lockedAt: null,
                    processingBy: null,
                    attempts: 0,
                },
            },
            { new: true },
        );
        expect(orFail).toHaveBeenCalled();
    });
});
