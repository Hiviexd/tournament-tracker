import { beforeEach, describe, expect, it, vi } from "vitest";
import { Types } from "mongoose";
import { InfringementType } from "@tc/types/Infringement";
import { TOURNAMENT_OPTIONS } from "@tc/types/Voting";

const mockAddInfringement = vi.hoisted(() => vi.fn());
const mockDeleteInfringement = vi.hoisted(() => vi.fn());
const mockSendAnnouncement = vi.hoisted(() => vi.fn());

vi.mock("../../models/userModel", () => ({ default: { find: vi.fn() } }));
vi.mock("../../models/voteModel", () => ({ default: { find: vi.fn() } }));
vi.mock("../../models/votingModel", () => ({ default: { find: vi.fn() } }));
vi.mock("@tc/config", () => ({ default: { baseUrl: "https://tcomm.test" } }));
vi.mock("../../services/InfringementService", () => ({
    default: { addInfringement: mockAddInfringement, deleteInfringement: mockDeleteInfringement },
}));
vi.mock("../../services/OsuBotService", () => ({
    default: { sendAnnouncement: mockSendAnnouncement },
}));

import VotingService from "../../services/VotingService";

function rankedVote(winnerIndex: number) {
    return {
        data: {
            type: "ranked-choice" as const,
            scores: TOURNAMENT_OPTIONS.map((_, index) => ({
                optionIndex: index,
                score: index === winnerIndex ? 2 : -2,
            })),
        },
    };
}

function makeVoting(overrides: Record<string, unknown> = {}) {
    return {
        isSanctionVote: true,
        isActive: false,
        assignedGroups: ["tc"],
        options: [...TOURNAMENT_OPTIONS],
        sanctionType: InfringementType.TOURNAMENT_BAN,
        sanctionPost: "Official reason",
        targetUser: {
            _id: new Types.ObjectId(),
            osuId: 123,
            username: "player",
        },
        votes: [rankedVote(2)],
        save: vi.fn().mockResolvedValue(undefined),
        updateOne: vi.fn().mockResolvedValue(undefined),
        ...overrides,
    };
}

const currentUser = { osuId: 999 } as any;

describe("VotingService.applySanction", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockAddInfringement.mockResolvedValue({
            infringement: { _id: new Types.ObjectId(), id: "inf-1" },
            user: {},
        });
        mockSendAnnouncement.mockResolvedValue(true);
    });

    it("rejects no-action outcomes", async () => {
        await expect(
            VotingService.applySanction(makeVoting({ votes: [rankedVote(0)] }) as any, currentUser),
        ).rejects.toMatchObject({
            status: 400,
            error: expect.stringContaining("no action required"),
        });
        expect(mockAddInfringement).not.toHaveBeenCalled();
    });

    it("rejects first-place ties", async () => {
        await expect(VotingService.applySanction(makeVoting({ votes: [] }) as any, currentUser)).rejects.toMatchObject({
            status: 400,
            error: expect.stringContaining("tied"),
        });
    });

    it("rejects already applied sanctions", async () => {
        await expect(
            VotingService.applySanction(makeVoting({ sanctionAppliedAt: new Date() }) as any, currentUser),
        ).rejects.toMatchObject({
            status: 400,
            error: expect.stringContaining("already been applied"),
        });
    });

    it("creates a warning infringement without dates", async () => {
        await VotingService.applySanction(makeVoting({ votes: [rankedVote(1)] }) as any, currentUser);

        expect(mockAddInfringement).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                type: InfringementType.WARNING,
                reason: "Official reason",
            }),
        );
        const payload = mockAddInfringement.mock.calls[0][1];
        expect(payload.startDate).toBeUndefined();
        expect(payload.endDate).toBeUndefined();
        expect(mockSendAnnouncement).toHaveBeenCalledWith(
            [123],
            expect.objectContaining({
                content: expect.arrayContaining([expect.stringContaining("**Reason for sanction**:")]),
            }),
            999,
        );
    });

    it("creates a timed ban from the selected type and duration", async () => {
        await VotingService.applySanction(makeVoting({ votes: [rankedVote(2)] }) as any, currentUser);

        expect(mockAddInfringement).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                type: InfringementType.TOURNAMENT_BAN,
                reason: "Official reason",
                startDate: expect.any(Date),
                endDate: expect.any(Date),
            }),
        );
    });

    it("retries announcement only after a failed send", async () => {
        const infringementId = new Types.ObjectId();
        mockSendAnnouncement.mockResolvedValueOnce({ error: "osu down", statusCode: 500 });

        const voting = makeVoting();
        await expect(VotingService.applySanction(voting as any, currentUser)).rejects.toMatchObject({
            status: 500,
        });
        expect(voting.sanctionInfringementId).toEqual(expect.anything());
        expect(voting.sanctionAppliedAt).toBeUndefined();

        mockSendAnnouncement.mockResolvedValueOnce(true);
        const retryVoting = makeVoting({
            sanctionInfringementId: infringementId,
            save: vi.fn().mockResolvedValue(undefined),
        });
        await VotingService.applySanction(retryVoting as any, currentUser);

        expect(mockAddInfringement).toHaveBeenCalledTimes(1);
        expect(retryVoting.sanctionAppliedAt).toBeInstanceOf(Date);
    });
});

describe("VotingService.undoSanction", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockDeleteInfringement.mockResolvedValue({ _id: new Types.ObjectId() });
    });

    it("rejects votes that are not sanction votes", async () => {
        await expect(
            VotingService.undoSanction(makeVoting({ isSanctionVote: false, sanctionAppliedAt: new Date() }) as any),
        ).rejects.toMatchObject({
            status: 400,
            error: expect.stringContaining("not a sanction vote"),
        });
        expect(mockDeleteInfringement).not.toHaveBeenCalled();
    });

    it("rejects votes that have not been applied", async () => {
        await expect(VotingService.undoSanction(makeVoting() as any)).rejects.toMatchObject({
            status: 400,
            error: expect.stringContaining("has not been applied"),
        });
        expect(mockDeleteInfringement).not.toHaveBeenCalled();
    });

    it("deletes the watchlist entry and resets apply fields", async () => {
        const infringementId = new Types.ObjectId();
        const voting = makeVoting({
            sanctionAppliedAt: new Date(),
            sanctionInfringementId: infringementId,
        });

        await VotingService.undoSanction(voting as any);

        expect(mockDeleteInfringement).toHaveBeenCalledWith(infringementId);
        expect(voting.sanctionInfringementId).toBeUndefined();
        expect(voting.sanctionAppliedAt).toBeUndefined();
        expect(voting.updateOne).toHaveBeenCalledWith({
            $unset: { sanctionInfringementId: 1, sanctionAppliedAt: 1 },
        });
    });

    it("resets apply fields when the watchlist entry is already gone", async () => {
        mockDeleteInfringement.mockResolvedValueOnce(null);
        const voting = makeVoting({
            sanctionAppliedAt: new Date(),
            sanctionInfringementId: new Types.ObjectId(),
        });

        await VotingService.undoSanction(voting as any);

        expect(voting.sanctionAppliedAt).toBeUndefined();
        expect(voting.updateOne).toHaveBeenCalled();
    });
});
