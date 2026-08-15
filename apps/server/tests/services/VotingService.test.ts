import { describe, it, expect, beforeEach, vi } from "vitest";
import { Types } from "mongoose";
import { IVoting } from "@tc/types/Voting";
import { IUser, UserGroup } from "@tc/types/User";
import User from "../../models/userModel";
import { createMockUsers } from "../utils/users";

vi.mock("../../models/userModel", () => ({
    default: {
        find: vi.fn(),
    },
}));

vi.mock("@tc/config", () => ({
    default: { baseUrl: "https://tcomm.test" },
}));

import VotingService from "../../services/VotingService";

const mockUser = User as unknown as { find: ReturnType<typeof vi.fn> };

function mockEligibleVoters(users: Pick<IUser, "_id">[]) {
    mockUser.find.mockReturnValue({
        select: vi.fn().mockResolvedValue(users),
    });
}

function votingInput(
    overrides: Partial<Pick<IVoting, "assignedGroups" | "forceFullParticipation" | "abstainedUsers">> = {},
) {
    return {
        assignedGroups: ["tc"] as UserGroup[],
        forceFullParticipation: false,
        abstainedUsers: [] as IUser[],
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

            const result = await VotingService.computeRequiredVotes(
                votingInput({ forceFullParticipation: true }),
            );

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
                    abstainedUsers: [voters[0]._id as unknown as IUser],
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
                assignedGroups: "cc" as unknown as UserGroup[],
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
    });

    describe("recalibrateRequiredVotes", () => {
        it("saves and reports a change when the quota moved", async () => {
            mockEligibleVoters(createMockUsers(10, { groups: ["tc"], isActiveVoter: true }));
            const save = vi.fn().mockResolvedValue(undefined);
            const voting = {
                requiredVotes: 10,
                assignedGroups: ["tc"] as UserGroup[],
                forceFullParticipation: false,
                abstainedUsers: [],
                save,
            };

            const result = await VotingService.recalibrateRequiredVotes(voting as never);

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
                assignedGroups: ["tc"] as UserGroup[],
                forceFullParticipation: false,
                abstainedUsers: [],
                save,
            };

            const result = await VotingService.recalibrateRequiredVotes(voting as never);

            expect(result.changed).toBe(false);
            expect(result.next).toBe(8);
            expect(save).not.toHaveBeenCalled();
        });
    });

    describe("isEligibleVoter", () => {
        it("delegates to the shared helper and accepts a single assigned group", () => {
            const user = createMockUsers(1, { groups: ["tc"], isActiveVoter: true })[0];

            expect(VotingService.isEligibleVoter(user, ["tc"])).toBe(true);
            expect(VotingService.isEligibleVoter(user, "tc" as unknown as UserGroup[])).toBe(true);
            expect(VotingService.isEligibleVoter({ ...user, isActiveVoter: false }, ["tc"])).toBe(false);
        });
    });

    describe("buildRecalibrationEmbed", () => {
        it("includes old/new quota, eligible count, and participation mode", () => {
            const voting = {
                _id: new Types.ObjectId(),
                title: "Badge support",
                forceFullParticipation: true,
            } as IVoting;

            const embed = VotingService.buildRecalibrationEmbed(voting, {
                previous: 8,
                next: 7,
                changed: true,
                eligibleCount: 7,
            }).build();

            expect(embed.description).toContain("Badge support");
            expect(embed.description).toContain("https://tcomm.test/votes/");
            expect(embed.fields).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ name: "Required Votes", value: "8 → 7" }),
                    expect.objectContaining({ name: "Eligible Voters", value: "7" }),
                    expect.objectContaining({ name: "Participation Requirement", value: "100%" }),
                ]),
            );
        });
    });
});
