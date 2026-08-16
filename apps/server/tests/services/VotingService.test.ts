import { describe, it, expect, beforeEach, vi } from "vitest";
import { Types } from "mongoose";
import { IUser, UserGroup } from "@tc/types/User";
import { createMockUsers } from "../utils/users";

const mockUser = vi.hoisted(() => ({
    find: vi.fn(),
    countDocuments: vi.fn(),
}));

const mockVoting = vi.hoisted(() => ({
    find: vi.fn(),
}));

vi.mock("../../models/userModel", () => ({
    default: mockUser,
}));

vi.mock("../../models/voteModel", () => ({
    default: {
        find: vi.fn(),
    },
}));

vi.mock("../../models/votingModel", () => ({
    default: mockVoting,
}));

vi.mock("@tc/config", () => ({
    default: { baseUrl: "https://tcomm.test" },
}));

import VotingService from "../../services/VotingService";

interface VotingInput {
    assignedGroups: UserGroup[] | UserGroup;
    forceFullParticipation?: boolean;
    abstainedUsers?: Array<IUser | Types.ObjectId>;
    votes?: Array<{ author?: IUser }>;
}

function mockEligibleVoters(users: Pick<IUser, "_id">[]) {
    mockUser.find.mockReturnValue({
        select: vi.fn().mockResolvedValue(users),
    });
}

function votingInput(overrides: Partial<VotingInput> = {}): VotingInput {
    return {
        assignedGroups: "tc",
        forceFullParticipation: false,
        abstainedUsers: [],
        ...overrides,
    };
}

describe("VotingService required votes", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("computeRequiredVotes", () => {
        it("uses 75% of eligible voters, rounded up", async () => {
            mockEligibleVoters(createMockUsers(10, { groups: ["tc"], isActiveVoter: true }));

            const result = await VotingService.computeRequiredVotes(votingInput());

            expect(mockUser.find).toHaveBeenCalledWith({
                groups: { $in: ["tc"] },
                isActiveVoter: true,
            });
            expect(result).toMatchObject({
                eligibleCount: 10,
                validAbstentionCount: 0,
                unclamped: 8,
                requiredVotes: 8,
            });
        });

        it("uses 100% of eligible voters when forceFullParticipation is true", async () => {
            mockEligibleVoters(createMockUsers(10, { groups: ["tc"], isActiveVoter: true }));

            const result = await VotingService.computeRequiredVotes(votingInput({ forceFullParticipation: true }));

            expect(result).toMatchObject({
                eligibleCount: 10,
                unclamped: 10,
                requiredVotes: 10,
            });
        });

        it("subtracts eligible abstentions after the percentage, not 75% of remaining people", async () => {
            const voters = createMockUsers(10, { groups: ["tc"], isActiveVoter: true });
            mockEligibleVoters(voters);

            const result = await VotingService.computeRequiredVotes(
                votingInput({ abstainedUsers: voters.slice(0, 3) }),
            );

            // 75% of 10 = 8, then minus 3 abstentions = 5
            // (75% of remaining 7 would be 6 — that is intentionally not used)
            expect(result).toMatchObject({
                eligibleCount: 10,
                validAbstentionCount: 3,
                unclamped: 5,
                requiredVotes: 5,
            });
        });

        it("does not subtract abstentions from people who are no longer eligible", async () => {
            const eligible = createMockUsers(9, { groups: ["tc"], isActiveVoter: true });
            const inactiveAbstainer = createMockUsers(1, { groups: ["tc"], isActiveVoter: false })[0];
            mockEligibleVoters(eligible);

            const result = await VotingService.computeRequiredVotes(
                votingInput({ abstainedUsers: [inactiveAbstainer, eligible[0]] }),
            );

            // inactive abstainer is ignored; only 1 valid abstention against ceil(0.75 * 9) = 7
            expect(result).toMatchObject({
                eligibleCount: 9,
                validAbstentionCount: 1,
                unclamped: 6,
                requiredVotes: 6,
            });
        });

        it("counts abstainers stored as ObjectIds or populated users", async () => {
            const voters = createMockUsers(4, { groups: ["tc"], isActiveVoter: true });
            mockEligibleVoters(voters);

            const populated = await VotingService.computeRequiredVotes(
                votingInput({ forceFullParticipation: true, abstainedUsers: [voters[0]] }),
            );
            expect(populated.validAbstentionCount).toBe(1);
            expect(populated.requiredVotes).toBe(3);

            mockEligibleVoters(voters);
            const byObjectId = await VotingService.computeRequiredVotes(
                votingInput({
                    forceFullParticipation: true,
                    abstainedUsers: [voters[0]._id],
                }),
            );
            expect(byObjectId.validAbstentionCount).toBe(1);
            expect(byObjectId.requiredVotes).toBe(3);
        });

        it("clamps requiredVotes at 1 and exposes unclamped when abstentions would empty the quota", async () => {
            const voters = createMockUsers(1, { groups: ["tc"], isActiveVoter: true });
            mockEligibleVoters(voters);

            const result = await VotingService.computeRequiredVotes(
                votingInput({ forceFullParticipation: true, abstainedUsers: voters }),
            );

            expect(result).toMatchObject({
                eligibleCount: 1,
                validAbstentionCount: 1,
                unclamped: 0,
                requiredVotes: 1,
            });
        });

        it("clamps to 1 when there are no eligible voters", async () => {
            mockEligibleVoters([]);

            const result = await VotingService.computeRequiredVotes(votingInput());

            expect(result).toMatchObject({
                eligibleCount: 0,
                unclamped: 0,
                requiredVotes: 1,
            });
        });

        it("normalizes a single assigned group string for the eligibility query", async () => {
            mockEligibleVoters(createMockUsers(4, { groups: ["cc"], isActiveVoter: true }));

            await VotingService.computeRequiredVotes({
                assignedGroups: "cc",
                forceFullParticipation: false,
                abstainedUsers: [],
            });

            expect(mockUser.find).toHaveBeenCalledWith({
                groups: { $in: ["cc"] },
                isActiveVoter: true,
            });
        });

        it("rounds 75% of 1 eligible voter up to 1", async () => {
            mockEligibleVoters(createMockUsers(1, { groups: ["tc"], isActiveVoter: true }));

            const result = await VotingService.computeRequiredVotes(votingInput());

            expect(result.requiredVotes).toBe(1);
            expect(result.unclamped).toBe(1);
        });

        it("keeps inactive vote authors in the roster when they are still in an assigned group", async () => {
            const liveEligible = createMockUsers(9, { groups: ["tc"], isActiveVoter: true });
            const inactiveVoter = createMockUsers(1, { groups: ["tc"], isActiveVoter: false })[0];
            mockEligibleVoters(liveEligible);
            mockUser.countDocuments.mockResolvedValue(1);

            const result = await VotingService.computeRequiredVotes(
                votingInput({
                    votes: [{ author: inactiveVoter }],
                }),
            );

            expect(mockUser.countDocuments).toHaveBeenCalledWith({
                _id: { $in: [inactiveVoter._id.toString()] },
                groups: { $in: ["tc"] },
            });
            expect(result).toMatchObject({
                eligibleCount: 10,
                unclamped: 8,
                requiredVotes: 8,
            });
        });

        it("does not keep inactive vote authors who left the assigned group", async () => {
            const liveEligible = createMockUsers(9, { groups: ["tc"], isActiveVoter: true });
            const formerMember = createMockUsers(1, { groups: ["cc"], isActiveVoter: false })[0];
            mockEligibleVoters(liveEligible);
            mockUser.countDocuments.mockResolvedValue(0);

            const result = await VotingService.computeRequiredVotes(
                votingInput({
                    votes: [{ author: formerMember }],
                }),
            );

            expect(result).toMatchObject({
                eligibleCount: 9,
                unclamped: 7,
                requiredVotes: 7,
            });
        });

        it("does not keep inactive people in the roster if they never voted", async () => {
            mockEligibleVoters(createMockUsers(9, { groups: ["tc"], isActiveVoter: true }));

            const result = await VotingService.computeRequiredVotes(votingInput());

            expect(mockUser.countDocuments).not.toHaveBeenCalled();
            expect(result).toMatchObject({
                eligibleCount: 9,
                unclamped: 7,
                requiredVotes: 7,
            });
        });
    });

    describe("recalibrateRequiredVotes", () => {
        it("saves and reports a change when the quota moved", async () => {
            mockEligibleVoters(createMockUsers(10, { groups: ["tc"], isActiveVoter: true }));
            const save = vi.fn().mockResolvedValue(undefined);
            const voting = {
                requiredVotes: 10,
                assignedGroups: "tc" as const,
                forceFullParticipation: false,
                abstainedUsers: [],
                save,
            };

            const result = await VotingService.recalibrateRequiredVotes(voting);

            expect(result).toEqual({
                previous: 10,
                next: 8,
                changed: true,
                eligibleCount: 10,
            });
            expect(voting.requiredVotes).toBe(8);
            expect(save).toHaveBeenCalledOnce();
        });

        it("does not save when the quota is already correct", async () => {
            mockEligibleVoters(createMockUsers(10, { groups: ["tc"], isActiveVoter: true }));
            const save = vi.fn().mockResolvedValue(undefined);
            const voting = {
                requiredVotes: 8,
                assignedGroups: "tc" as const,
                forceFullParticipation: false,
                abstainedUsers: [],
                save,
            };

            const result = await VotingService.recalibrateRequiredVotes(voting);

            expect(result.changed).toBe(false);
            expect(result.next).toBe(8);
            expect(save).not.toHaveBeenCalled();
        });
    });

    describe("recalibrateActiveVotingsForGroups", () => {
        it("returns no votings when there are no committee groups", async () => {
            const changed = await VotingService.recalibrateActiveVotingsForGroups(["user"]);

            expect(changed).toEqual([]);
            expect(mockVoting.find).not.toHaveBeenCalled();
        });

        it("recalibrates active votings in those groups and returns only changes", async () => {
            const voters = createMockUsers(10, { groups: ["tc"], isActiveVoter: true });
            mockUser.find.mockReturnValue({
                select: vi.fn().mockResolvedValue(voters),
            });

            const stale = {
                _id: new Types.ObjectId(),
                title: "Stale quota",
                requiredVotes: 10,
                assignedGroups: "tc" as const,
                forceFullParticipation: false,
                abstainedUsers: [],
                save: vi.fn().mockResolvedValue(undefined),
            };
            const current = {
                _id: new Types.ObjectId(),
                title: "Already current",
                requiredVotes: 8,
                assignedGroups: "tc" as const,
                forceFullParticipation: false,
                abstainedUsers: [],
                save: vi.fn().mockResolvedValue(undefined),
            };
            mockVoting.find.mockResolvedValue([stale, current]);

            const changed = await VotingService.recalibrateActiveVotingsForGroups(["tc", "user"]);

            expect(mockVoting.find).toHaveBeenCalledWith({
                isActive: true,
                assignedGroups: { $in: ["tc"] },
            });
            expect(changed).toHaveLength(1);
            expect(changed[0].voting).toBe(stale);
            expect(changed[0].result).toMatchObject({ previous: 10, next: 8, changed: true });
            expect(stale.save).toHaveBeenCalledOnce();
            expect(current.save).not.toHaveBeenCalled();
        });
    });

    describe("isEligibleVoter", () => {
        it("delegates to the shared helper and accepts a single assigned group", () => {
            const user = createMockUsers(1, { groups: ["tc"], isActiveVoter: true })[0];

            expect(VotingService.isEligibleVoter(user, ["tc"])).toBe(true);
            expect(VotingService.isEligibleVoter(user, "tc")).toBe(true);
            expect(VotingService.isEligibleVoter({ ...user, isActiveVoter: false }, ["tc"])).toBe(false);
        });
    });

    describe("buildRecalibrationEmbed", () => {
        it("lists a single vote's quota change", () => {
            const voting = {
                _id: new Types.ObjectId(),
                title: "Badge support",
                forceFullParticipation: true,
            };

            const embed = VotingService.buildRecalibrationEmbed([
                {
                    voting,
                    result: { previous: 8, next: 7, changed: true, eligibleCount: 7 },
                },
            ]).build();

            expect(embed.description).toContain("Recalibrated required votes for **1 vote**");
            expect(embed.description).toContain("Badge support");
            expect(embed.description).toContain("- [**Badge support**]");
            expect(embed.description).toContain("**8 → 7** (7 eligible, 100%)");
            expect(embed.fields).toBeUndefined();
        });

        it("combines multiple vote quota changes into one embed", () => {
            const first = {
                _id: new Types.ObjectId(),
                title: "Badge support",
                forceFullParticipation: true,
            };
            const second = {
                _id: new Types.ObjectId(),
                title: "User addition",
                forceFullParticipation: false,
            };

            const embed = VotingService.buildRecalibrationEmbed([
                {
                    voting: first,
                    result: { previous: 8, next: 7, changed: true, eligibleCount: 7 },
                },
                {
                    voting: second,
                    result: { previous: 10, next: 9, changed: true, eligibleCount: 12 },
                },
            ]).build();

            expect(embed.description).toContain("Recalibrated required votes for **2 votes**");
            expect(embed.description).toContain("- [**Badge support**]");
            expect(embed.description).toContain("**8 → 7**");
            expect(embed.description).toContain("- [**User addition**]");
            expect(embed.description).toContain("**10 → 9**");
            expect(embed.description).toContain("75%");
            expect(embed.fields).toBeUndefined();
        });
    });
});

describe("VotingService.censorVotingForNonCommittee", () => {
    it("strips sanction post and target user watchlist data", () => {
        // SAFETY: censor only reads toObject(); this fixture is not a mongoose document.
        const publicVoting = VotingService.censorVotingForNonCommittee({
            toObject: () => ({
                description: "private notes",
                sanctionPost: "official reason",
                attachments: [{}],
                abstainedUsers: [{}],
                votes: [{ comment: "secret", author: {} }],
                targetUser: {
                    username: "player",
                    infringements: [{ reason: "watchlist" }],
                    activeInfringement: { reason: "watchlist" },
                    latestAction: { reason: "watchlist" },
                },
            }),
        } as never);

        expect(publicVoting.description).toBe("");
        expect(publicVoting.sanctionPost).toBeUndefined();
        expect(publicVoting.targetUser?.infringements).toBeUndefined();
        expect(publicVoting.targetUser?.activeInfringement).toBeUndefined();
        expect(publicVoting.targetUser?.latestAction).toBeUndefined();
        expect(publicVoting.targetUser?.username).toBe("player");
    });
});
