import { describe, expect, it } from "vitest";
import NotificationDispatchService from "../../services/NotificationDispatchService";

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
});
