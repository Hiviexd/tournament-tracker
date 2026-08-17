import { beforeEach, describe, expect, it, vi } from "vitest";
import OsuSender from "../../services/notifications/OsuSender";
import OsuBotService from "../../services/OsuBotService";

vi.mock("../../services/OsuBotService", () => ({
    default: {
        sendAnnouncementDirect: vi.fn(),
    },
}));

describe("OsuSender", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns success when direct osu send succeeds", async () => {
        vi.mocked(OsuBotService.sendAnnouncementDirect).mockResolvedValue({ sentTo: [1] });

        const payload = {
            userIds: [1],
            message: {
                channel: {
                    name: "test",
                    description: "desc",
                },
                content: "hello",
            },
        };

        const result = await OsuSender.send({ payload });

        expect(result.ok).toBe(true);
        expect(result.statusCode).toBe(200);
        expect(payload.sentTo).toEqual([1]);
    });

    it("marks 429 as retryable", async () => {
        vi.mocked(OsuBotService.sendAnnouncementDirect).mockResolvedValue({
            error: "rate limited",
            statusCode: 429,
        });

        const result = await OsuSender.send({
            payload: {
                userIds: [1],
                message: {
                    channel: {
                        name: "test",
                        description: "desc",
                    },
                    content: "hello",
                },
            },
        });

        expect(result.ok).toBe(false);
        expect(result.retryable).toBe(true);
        expect(result.statusCode).toBe(429);
    });
});
