import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import DiscordSender from "../../services/notifications/DiscordSender";

vi.mock("axios", () => ({
    default: {
        post: vi.fn(),
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
});
