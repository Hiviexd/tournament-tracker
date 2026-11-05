import { describe, it, expect, afterEach, vi } from "vitest";
import { Types } from "mongoose";
import type { Request } from "express";
import { handleCrawlers } from "../../middlewares/seo";
import Tournament from "../../models/tournamentModel";
import User from "../../models/userModel";
import { stubCollectionReads } from "../utils/stubCollection";

vi.mock("@tc/config", () => ({ default: { baseUrl: "https://example.test" } }));

type CrawlerResponse = Parameters<typeof handleCrawlers>[1];

async function crawl(path: string) {
    const send = vi.fn();
    const next = vi.fn();
    const req: Partial<Request> = {
        path,
        headers: { "user-agent": "Mozilla/5.0 (compatible; Discordbot/2.0)" },
    };
    const res: Partial<CrawlerResponse> = { send };
    // SAFETY: handleCrawlers only reads path and headers from req, and only calls send on res.
    await handleCrawlers(req as Request, res as CrawlerResponse, next);
    return { send, next };
}

describe("handleCrawlers", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("renders a tournament preview naming its hosts", async () => {
        const hostId = new Types.ObjectId();
        const tournamentId = new Types.ObjectId();
        stubCollectionReads(Tournament, [
            { _id: tournamentId, name: "Example Cup", type: "tournament", hosts: [hostId] },
        ]);
        stubCollectionReads(User, [{ _id: hostId, username: "ExampleHost" }]);

        const { send, next } = await crawl(`/tournaments/${tournamentId}`);

        expect(next).not.toHaveBeenCalled();
        expect(send).toHaveBeenCalledTimes(1);
        expect(send.mock.calls[0]![0]).toContain("Example Cup - Tournament Details");
        expect(send.mock.calls[0]![0]).toContain("Tournament hosted by ExampleHost");
    });
});
