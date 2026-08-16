import { beforeEach, describe, expect, it, vi } from "vitest";
import { Document, Types } from "mongoose";
import { InfringementType } from "@tc/types/Infringement";
import { IUser } from "@tc/types/User";
import { IVoting, TOURNAMENT_OPTIONS } from "@tc/types/Voting";
import { SanctionVoteBallot } from "@tc/utils";

const mockAddInfringement = vi.hoisted(() => vi.fn());
const mockDeleteInfringement = vi.hoisted(() => vi.fn());
const mockSyncSanctionInfringement = vi.hoisted(() => vi.fn());
const mockSendAnnouncement = vi.hoisted(() => vi.fn());

vi.mock("../../models/userModel", () => ({ default: { find: vi.fn() } }));
vi.mock("../../models/voteModel", () => ({ default: { find: vi.fn() } }));
vi.mock("../../models/votingModel", () => ({ default: { find: vi.fn() } }));
vi.mock("@tc/config", () => ({ default: { baseUrl: "https://tcomm.test" } }));
vi.mock("../../services/InfringementService", () => ({
    default: {
        addInfringement: mockAddInfringement,
        deleteInfringement: mockDeleteInfringement,
        syncSanctionInfringement: mockSyncSanctionInfringement,
    },
}));
vi.mock("../../services/OsuBotService", () => ({
    default: { sendAnnouncementDirect: mockSendAnnouncement },
}));

import VotingService from "../../services/VotingService";

type SanctionVotingDoc = Document & IVoting;

interface SanctionVotingFixture {
    isSanctionVote?: boolean;
    isActive?: boolean;
    assignedGroups?: IVoting["assignedGroups"];
    options?: IVoting["options"];
    sanctionType?: IVoting["sanctionType"];
    sanctionPost?: IVoting["sanctionPost"];
    targetUsers?: IVoting["targetUsers"];
    votes?: SanctionVoteBallot[];
    sanctionAppliedAt?: Date;
    sanctionInfringementIds?: Types.ObjectId[];
    sanctionAnnouncementChannelId?: number;
    sanctionAnnouncementSentCount?: number;
    save?: SanctionVotingDoc["save"];
    updateOne?: SanctionVotingDoc["updateOne"];
}

function rankedVote(winnerIndex: number): SanctionVoteBallot {
    return {
        data: {
            type: "ranked-choice",
            scores: TOURNAMENT_OPTIONS.map((_, index) => ({
                optionIndex: index,
                score: index === winnerIndex ? 2 : -2,
            })),
        },
    };
}

function makeVoting(overrides: SanctionVotingFixture = {}): SanctionVotingDoc {
    // SAFETY: fixture only supplies the sanction fields and persist methods used by apply/undo.
    return {
        isSanctionVote: true,
        isActive: false,
        assignedGroups: ["tc"],
        options: [...TOURNAMENT_OPTIONS],
        sanctionType: InfringementType.TOURNAMENT_BAN,
        sanctionPost: "Official reason",
        targetUsers: [
            {
                _id: new Types.ObjectId(),
                osuId: 123,
                username: "player",
            },
        ],
        votes: [rankedVote(2)],
        save: vi.fn().mockResolvedValue(undefined),
        updateOne: vi.fn().mockResolvedValue(undefined),
        ...overrides,
    } as SanctionVotingDoc;
}

const currentUser = { osuId: 999 } satisfies Pick<IUser, "osuId">;

describe("VotingService.applySanction", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockAddInfringement.mockResolvedValue({
            infringement: { _id: new Types.ObjectId(), id: "inf-1" },
            user: {},
        });
        mockSendAnnouncement.mockResolvedValue(true);
        mockSyncSanctionInfringement.mockResolvedValue({ changed: false });
    });

    it("rejects no-action outcomes", async () => {
        await expect(
            VotingService.applySanction(makeVoting({ votes: [rankedVote(0)] }), currentUser),
        ).rejects.toMatchObject({
            status: 400,
            error: expect.stringContaining("no action required"),
        });
        expect(mockAddInfringement).not.toHaveBeenCalled();
    });

    it("rejects first-place ties", async () => {
        await expect(VotingService.applySanction(makeVoting({ votes: [] }), currentUser)).rejects.toMatchObject({
            status: 400,
            error: expect.stringContaining("tied"),
        });
    });

    it("rejects already applied sanctions", async () => {
        await expect(
            VotingService.applySanction(makeVoting({ sanctionAppliedAt: new Date() }), currentUser),
        ).rejects.toMatchObject({
            status: 400,
            error: expect.stringContaining("already been applied"),
        });
    });

    it("creates a warning infringement without dates", async () => {
        await VotingService.applySanction(makeVoting({ votes: [rankedVote(1)] }), currentUser);

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
        await VotingService.applySanction(makeVoting({ votes: [rankedVote(2)] }), currentUser);

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

    it("applies the sanction to every target user", async () => {
        await VotingService.applySanction(
            makeVoting({
                targetUsers: [
                    // SAFETY: fixture only supplies the sanction fields and persist methods used by apply/undo.
                    { _id: new Types.ObjectId(), osuId: 123, username: "player" } as IUser,
                    // SAFETY: fixture only supplies the sanction fields and persist methods used by apply/undo.
                    { _id: new Types.ObjectId(), osuId: 456, username: "other" } as IUser,
                ],
            }),
            currentUser,
        );

        expect(mockAddInfringement).toHaveBeenCalledTimes(2);
        expect(mockSendAnnouncement).toHaveBeenCalledWith([123, 456], expect.any(Object), 999);
    });

    it("retries announcement only after a failed send", async () => {
        const infringementId = new Types.ObjectId();
        mockSendAnnouncement.mockResolvedValueOnce({ error: "osu down", statusCode: 500 });

        const voting = makeVoting();
        await expect(VotingService.applySanction(voting, currentUser)).rejects.toMatchObject({
            status: 500,
        });
        expect(voting.sanctionInfringementIds).toEqual(expect.anything());
        expect(voting.sanctionAppliedAt).toBeUndefined();

        mockSendAnnouncement.mockResolvedValueOnce(true);
        const retryVoting = makeVoting({
            sanctionInfringementIds: [infringementId],
            save: vi.fn().mockResolvedValue(undefined),
        });
        await VotingService.applySanction(retryVoting, currentUser);

        expect(mockAddInfringement).toHaveBeenCalledTimes(1);
        expect(mockSyncSanctionInfringement).toHaveBeenCalledWith(
            infringementId,
            expect.any(String),
            expect.objectContaining({
                type: InfringementType.TOURNAMENT_BAN,
                reason: "Official reason",
            }),
        );
        expect(retryVoting.sanctionAppliedAt).toBeInstanceOf(Date);
    });

    it("resyncs the watchlist and starts a new announcement after an edit", async () => {
        mockSyncSanctionInfringement.mockResolvedValueOnce({ changed: true });

        const voting = makeVoting({
            sanctionInfringementIds: [new Types.ObjectId()],
            sanctionPost: "Edited reason",
            sanctionAnnouncementChannelId: 44,
            sanctionAnnouncementSentCount: 2,
        });
        await VotingService.applySanction(voting, currentUser);

        expect(mockAddInfringement).not.toHaveBeenCalled();
        expect(mockSyncSanctionInfringement).toHaveBeenCalledWith(
            voting.sanctionInfringementIds?.[0],
            expect.any(String),
            expect.objectContaining({ reason: "Edited reason" }),
        );
        expect(mockSendAnnouncement).toHaveBeenCalledWith(
            [123],
            expect.objectContaining({
                channelId: undefined,
                sentCount: undefined,
            }),
            999,
        );
    });

    it("saves announcement progress when a follow-up message fails", async () => {
        mockSendAnnouncement.mockImplementation((_ids, message) => {
            message.channelId = 44;
            message.sentCount = 1;
            return { error: "osu down", statusCode: 500 };
        });

        const voting = makeVoting();
        await expect(VotingService.applySanction(voting, currentUser)).rejects.toMatchObject({
            status: 500,
        });
        expect(voting.sanctionAnnouncementChannelId).toBe(44);
        expect(voting.sanctionAnnouncementSentCount).toBe(1);
        expect(voting.sanctionAppliedAt).toBeUndefined();
    });
});

describe("VotingService.undoSanction", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockDeleteInfringement.mockResolvedValue({ _id: new Types.ObjectId() });
    });

    it("rejects votes that are not sanction votes", async () => {
        await expect(
            VotingService.undoSanction(makeVoting({ isSanctionVote: false, sanctionAppliedAt: new Date() })),
        ).rejects.toMatchObject({
            status: 400,
            error: expect.stringContaining("not a sanction vote"),
        });
        expect(mockDeleteInfringement).not.toHaveBeenCalled();
    });

    it("rejects votes that have not been applied", async () => {
        await expect(VotingService.undoSanction(makeVoting())).rejects.toMatchObject({
            status: 400,
            error: expect.stringContaining("has not been applied"),
        });
        expect(mockDeleteInfringement).not.toHaveBeenCalled();
    });

    it("deletes the watchlist entry and resets apply fields", async () => {
        const infringementId = new Types.ObjectId();
        const voting = makeVoting({
            sanctionAppliedAt: new Date(),
            sanctionInfringementIds: [infringementId],
        });

        await VotingService.undoSanction(voting);

        expect(mockDeleteInfringement).toHaveBeenCalledWith(infringementId);
        expect(voting.sanctionInfringementIds).toBeUndefined();
        expect(voting.sanctionAppliedAt).toBeUndefined();
        expect(voting.updateOne).toHaveBeenCalledWith({
            $unset: {
                sanctionInfringementIds: 1,
                sanctionAppliedAt: 1,
                sanctionAnnouncementChannelId: 1,
                sanctionAnnouncementSentCount: 1,
            },
        });
    });

    it("resets apply fields when the watchlist entry is already gone", async () => {
        mockDeleteInfringement.mockResolvedValueOnce(null);
        const voting = makeVoting({
            sanctionAppliedAt: new Date(),
            sanctionInfringementIds: [new Types.ObjectId()],
        });

        await VotingService.undoSanction(voting);

        expect(voting.sanctionAppliedAt).toBeUndefined();
        expect(voting.updateOne).toHaveBeenCalled();
    });
});
