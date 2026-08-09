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
        vi.mocked(NotificationDispatchService.enqueueDiscordWebhook).mockResolvedValue({} as any);

        await new WebhookBuilder().addEmbed({ color: 123456, description: "bulk update" }).setMessage("test").send();

        expect(NotificationDispatchService.enqueueDiscordWebhook).toHaveBeenCalledTimes(1);
        expect(NotificationDispatchService.enqueueDiscordWebhook).toHaveBeenCalledWith(
            expect.objectContaining({
                embeds: [expect.objectContaining({ description: "bulk update" })],
                message: "test",
            }),
        );
    });
});
