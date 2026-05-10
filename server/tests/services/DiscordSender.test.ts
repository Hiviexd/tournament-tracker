import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import DiscordSender from "../../services/notifications/DiscordSender";

vi.mock("axios", () => ({
    default: {
        post: vi.fn(),
    },
}));

describe("DiscordSender", () => {
    const originalNodeEnv = process.env.NODE_ENV;

    beforeEach(() => {
        vi.clearAllMocks();
        process.env.NODE_ENV = originalNodeEnv;
    });

    afterEach(() => {
        process.env.NODE_ENV = originalNodeEnv;
    });

    it("returns success for successful webhook requests", async () => {
        vi.mocked(axios.post).mockResolvedValue({ data: {} } as any);

        const result = await DiscordSender.send({
            payload: {
                location: "main",
                embeds: [{ color: 123456, description: "hello" }],
                message: "test",
            },
        } as any);

        expect(result.ok).toBe(true);
        expect(result.retryable).toBe(false);
    });

    it("returns retryable for 429 responses", async () => {
        vi.mocked(axios.post).mockRejectedValue({
            response: {
                status: 429,
                data: { message: "rate limited" },
            },
        });

        const result = await DiscordSender.send({
            payload: {
                location: "main",
                embeds: [{ color: 123456, description: "hello" }],
            },
        } as any);

        expect(result.ok).toBe(false);
        expect(result.retryable).toBe(true);
        expect(result.statusCode).toBe(429);
    });

    it("skips thread_id in development environment", async () => {
        process.env.NODE_ENV = "development";
        vi.mocked(axios.post).mockResolvedValue({ data: {} } as any);

        await DiscordSender.send({
            payload: {
                location: "main",
                threadId: "1234567890",
                embeds: [{ color: 123456, description: "dev channel root post" }],
            },
        } as any);

        const requestUrl = vi.mocked(axios.post).mock.calls[0][0] as string;
        expect(requestUrl).not.toContain("thread_id=");
    });
});
