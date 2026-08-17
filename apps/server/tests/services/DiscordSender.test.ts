import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import DiscordSender from "../../services/notifications/DiscordSender";

vi.mock("axios", () => ({
    default: {
        post: vi.fn(),
        patch: vi.fn(),
        isAxiosError: (error: { isAxiosError?: boolean }) => Boolean(error.isAxiosError),
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
        vi.mocked(axios.post).mockResolvedValue({ data: {}, status: 204 });

        const result = await DiscordSender.send({
            payload: {
                location: "main",
                embeds: [{ color: 123456, description: "hello" }],
                message: "test",
            },
        });

        expect(result.ok).toBe(true);
        expect(result.retryable).toBe(false);
        expect(result.statusCode).toBe(204);
    });

    it("returns retryable for 429 responses", async () => {
        vi.mocked(axios.post).mockRejectedValue({
            isAxiosError: true,
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
        });

        expect(result.ok).toBe(false);
        expect(result.retryable).toBe(true);
        expect(result.statusCode).toBe(429);
    });

    it("extracts status from AxiosError failures", async () => {
        const error = Object.assign(new Error("Request failed with status code 502"), {
            isAxiosError: true,
            response: {
                status: 502,
                data: { message: "bad gateway" },
            },
        });
        vi.mocked(axios.post).mockRejectedValue(error);

        const result = await DiscordSender.send({
            payload: {
                location: "main",
                embeds: [{ color: 123456, description: "fail" }],
            },
        });

        expect(result.ok).toBe(false);
        expect(result.retryable).toBe(true);
        expect(result.statusCode).toBe(502);
        expect(result.error).toBe("bad gateway");
    });

    it("skips thread_id in development environment", async () => {
        process.env.NODE_ENV = "development";
        vi.mocked(axios.post).mockResolvedValue({ data: {} });

        await DiscordSender.send({
            payload: {
                location: "main",
                threadId: "1234567890",
                embeds: [{ color: 123456, description: "dev channel root post" }],
            },
        });

        const requestUrl = String(vi.mocked(axios.post).mock.calls[0][0]);
        expect(requestUrl).not.toContain("thread_id=");
    });

    it("waits for the created message and returns its id", async () => {
        vi.mocked(axios.post).mockResolvedValue({ data: { id: "123456789012345678" }, status: 200 });

        const result = await DiscordSender.send({
            payload: {
                location: "main",
                embeds: [{ color: 123456, description: "news" }],
                wait: true,
            },
        });

        const requestUrl = String(vi.mocked(axios.post).mock.calls[0][0]);
        expect(requestUrl).toContain("/api/v10/webhooks/");
        expect(requestUrl).toContain("wait=true");
        expect(result.ok).toBe(true);
        expect(result.messageId).toBe("123456789012345678");
    });

    it("edits an existing webhook message without changing content", async () => {
        vi.mocked(axios.patch).mockResolvedValue({ data: { id: "999888777666555444" }, status: 200 });

        const embeds = [{ color: 123456, description: "updated news" }];
        const result = await DiscordSender.send({
            payload: {
                location: "main",
                embeds,
                editMessageId: "999888777666555444",
                wait: true,
            },
        });

        expect(axios.post).not.toHaveBeenCalled();
        expect(axios.patch).toHaveBeenCalledTimes(1);

        const requestUrl = String(vi.mocked(axios.patch).mock.calls[0][0]);
        expect(requestUrl).toContain("/messages/999888777666555444");
        expect(requestUrl).not.toContain("wait=");
        expect(vi.mocked(axios.patch).mock.calls[0][1]).toEqual({
            embeds,
            flags: undefined,
        });
        expect(result.ok).toBe(true);
        expect(result.messageId).toBe("999888777666555444");
    });
});
