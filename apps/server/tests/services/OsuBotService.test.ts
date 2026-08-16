import { beforeEach, describe, expect, it, vi } from "vitest";

const executeRequest = vi.hoisted(() => vi.fn());
const delay = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

vi.mock("@tc/config", () => ({
    default: { osuBot: { id: "1", secret: "secret" } },
}));
vi.mock("@tc/utils/server", () => ({
    default: { delay },
}));
vi.mock("../../services/NotificationDispatchService", () => ({
    default: { enqueueOsuAnnouncement: vi.fn() },
}));

import OsuApiService from "../../services/OsuApiService";
import OsuBotService from "../../services/OsuBotService";

describe("OsuBotService.sendAnnouncementDirect", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // SAFETY: getBotToken is private static; the test only needs a resolved token.
        vi.spyOn(OsuBotService as any, "getBotToken").mockResolvedValue("token");
        // SAFETY: executeRequest is protected static; the test replaces the HTTP boundary.
        vi.spyOn(OsuApiService as any, "executeRequest").mockImplementation(executeRequest);
        process.env.NODE_ENV = "production";
    });

    it("keeps the single-message create-channel path", async () => {
        executeRequest.mockResolvedValueOnce({ channel_id: 10 });

        const result = await OsuBotService.sendAnnouncementDirect(
            [1],
            { channel: { name: "Notice", description: "Now" }, content: "hello" },
            2,
        );

        expect(result).toBe(true);
        expect(executeRequest).toHaveBeenCalledTimes(1);
        expect(executeRequest.mock.calls[0][0]).toMatchObject({
            url: "https://osu.ppy.sh/api/v2/chat/channels/",
            data: {
                message: "hello",
                target_ids: [1],
                type: "ANNOUNCE",
            },
        });
    });

    it("creates the channel then sends follow-up messages", async () => {
        executeRequest.mockResolvedValueOnce({ channel_id: 44 }).mockResolvedValueOnce({ message_id: 2 }).mockResolvedValueOnce({
            message_id: 3,
        });

        const result = await OsuBotService.sendAnnouncementDirect(
            [1],
            {
                channel: { name: "Notice of Tournament Sanction", description: "Immediate Action Required" },
                content: ["intro", "reason", "outro"],
            },
        );

        expect(result).toBe(true);
        expect(executeRequest).toHaveBeenCalledTimes(3);
        expect(executeRequest.mock.calls[0][0].data.message).toBe("intro");
        expect(executeRequest.mock.calls[1][0]).toMatchObject({
            url: "https://osu.ppy.sh/api/v2/chat/channels/44/messages",
            data: { message: "reason", is_action: false },
        });
        expect(executeRequest.mock.calls[2][0].data.message).toBe("outro");
        expect(delay).toHaveBeenCalledTimes(3);
    });

    it("resumes follow-up messages on an existing channel", async () => {
        executeRequest.mockResolvedValueOnce({ message_id: 3 });

        const message = {
            channel: { name: "Notice" },
            content: ["intro", "reason", "outro"],
            channelId: 44,
            sentCount: 2,
        };
        const result = await OsuBotService.sendAnnouncementDirect([1], message);

        expect(result).toBe(true);
        expect(executeRequest).toHaveBeenCalledTimes(1);
        expect(executeRequest.mock.calls[0][0]).toMatchObject({
            url: "https://osu.ppy.sh/api/v2/chat/channels/44/messages",
            data: { message: "outro", is_action: false },
        });
        expect(message.sentCount).toBe(3);
    });

    it("rejects empty message arrays", async () => {
        const result = await OsuBotService.sendAnnouncementDirect([1], {
            channel: { name: "Notice" },
            content: ["intro", "   "],
        });

        expect(result).toMatchObject({ statusCode: 400 });
        expect(executeRequest).not.toHaveBeenCalled();
    });
});
