import { beforeEach, describe, expect, it, vi } from "vitest";
import { WebhookBuilder } from "../../services/discord/WebhookBuilder";
import NotificationDispatchService from "../../services/NotificationDispatchService";

vi.mock("../../services/NotificationDispatchService", () => ({
    default: {
        enqueueDiscordWebhook: vi.fn(),
    },
}));

describe("WebhookBuilder queue integration", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("enqueues discord payload instead of sending directly", async () => {
        vi.mocked(NotificationDispatchService.enqueueDiscordWebhook).mockResolvedValue(
            // SAFETY: test only asserts enqueue was called, not the returned job document.
            {} as Awaited<ReturnType<typeof NotificationDispatchService.enqueueDiscordWebhook>>,
        );

        await new WebhookBuilder().addEmbed({ color: 123456, description: "bulk update" }).setMessage("test").send();

        expect(NotificationDispatchService.enqueueDiscordWebhook).toHaveBeenCalledTimes(1);
        expect(NotificationDispatchService.enqueueDiscordWebhook).toHaveBeenCalledWith(
            expect.objectContaining({
                embeds: [expect.objectContaining({ description: "bulk update" })],
                message: "test",
            }),
        );
        expect(NotificationDispatchService.enqueueDiscordWebhook).toHaveBeenCalledWith(
            expect.not.objectContaining({
                wait: true,
                editMessageId: expect.anything(),
            }),
        );
    });

    it("includes wait and edit fields when configured", async () => {
        vi.mocked(NotificationDispatchService.enqueueDiscordWebhook).mockResolvedValue(
            // SAFETY: test only asserts enqueue was called, not the returned job document.
            {} as Awaited<ReturnType<typeof NotificationDispatchService.enqueueDiscordWebhook>>,
        );

        await new WebhookBuilder()
            .addEmbed({ color: 123456, description: "news" })
            .setLocation("news")
            .waitForMessage()
            .editMessage("111")
            .send();

        expect(NotificationDispatchService.enqueueDiscordWebhook).toHaveBeenCalledWith(
            expect.objectContaining({
                location: "news",
                wait: true,
                editMessageId: "111",
            }),
        );
    });
});
