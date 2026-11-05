import { describe, it, expect, afterEach, vi } from "vitest";
import { Types } from "mongoose";
import type { Request, Response } from "express";
import TournamentsController from "../../controllers/TournamentsController";
import Infringement from "../../models/infringementModel";
import Tournament from "../../models/tournamentModel";
import User from "../../models/userModel";
import { IInfringement, InfringementType } from "@tc/types/Infringement";
import { IUser } from "@tc/types/User";
import { stubCollectionReads } from "../utils/stubCollection";

vi.mock("@tc/config", () => ({ default: { baseUrl: "https://example.test" } }));
vi.mock("../../services/UploadService", () => ({ default: {} }));
vi.mock("../../services/LogService", () => ({ default: { generate: vi.fn() } }));
vi.mock("../../services/TournamentService", () => ({ default: { addTournamentLog: vi.fn() } }));
vi.mock("../../services/discord/DiscordUtils", () => ({
    default: { defaultWebhookAuthor: vi.fn(() => ({ name: "Admin" })), webhookColors: { green: 0 } },
}));
vi.mock("../../services/discord/WebhookBuilder", () => ({
    WebhookBuilder: class {
        addEmbed() {
            return this;
        }
        async send() {}
    },
}));

const DAY_MS = 24 * 60 * 60 * 1000;

async function createWithHost(infringement: Pick<IInfringement, "type" | "startDate" | "endDate">) {
    const hostId = new Types.ObjectId();
    stubCollectionReads(User, [{ _id: hostId, username: "ExampleHost" }]);
    stubCollectionReads(Infringement, [
        { _id: new Types.ObjectId(), userId: hostId, reason: "test", createdAt: new Date(), ...infringement },
    ]);
    const save = vi.spyOn(Tournament.prototype, "save").mockResolvedValue(undefined);

    const req: Partial<Request> = {
        body: {
            name: "Example Cup",
            hostIds: [hostId.toString()],
            modes: ["osu"],
            forumUrl: "https://osu.ppy.sh/community/forums/topics/1",
            type: "tournament",
            startDate: new Date(),
            endDate: new Date(Date.now() + DAY_MS),
        },
    };
    const json = vi.fn();
    const status = vi.fn().mockReturnValue({ json });
    const res: Partial<Response> = {
        // SAFETY: create only reads id from the current user before it reaches the mocked services.
        locals: { user: { id: "admin-id" } as IUser },
        status,
        json,
    };

    // SAFETY: the rejected path reads body from req; the allowed path's Discord author is mocked below.
    await TournamentsController.create(req as Request, res as Response);
    return { save, status, json };
}

describe("TournamentsController.create", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("rejects a host with an active ban", async () => {
        const { save, status, json } = await createWithHost({
            type: InfringementType.HOSTING_BAN,
            startDate: new Date(Date.now() - DAY_MS),
        });

        expect(status).toHaveBeenCalledWith(400);
        expect(json).toHaveBeenCalledWith({
            error: "Cannot create tournament with hosts that have active infringements: ExampleHost",
        });
        expect(save).not.toHaveBeenCalled();
    });

    it("allows a host whose ban has expired", async () => {
        const { save, status } = await createWithHost({
            type: InfringementType.HOSTING_BAN,
            startDate: new Date(Date.now() - 2 * DAY_MS),
            endDate: new Date(Date.now() - DAY_MS),
        });

        expect(status).not.toHaveBeenCalled();
        expect(save).toHaveBeenCalledTimes(1);
    });
});
