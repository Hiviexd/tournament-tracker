import { describe, it, expect, beforeEach, vi } from "vitest";
import { Types } from "mongoose";
import UserService from "../../services/UserService";
import User from "../../models/userModel";
import { createMockTCUsers, createMockCCUsers } from "../utils/users";

const lodashAssignMocks = vi.hoisted(() => ({
    sampleSize: vi.fn(),
    /** Preserve order so sampleSize receives the same user array as from DB */
    shuffle: vi.fn((users: unknown[]) => [...users]),
}));

// Mock the User model
vi.mock("../../models/userModel", () => ({
    default: {
        countDocuments: vi.fn(),
        find: vi.fn(),
        updateMany: vi.fn(),
    },
}));

vi.mock("lodash/sampleSize", () => ({ default: lodashAssignMocks.sampleSize }));
vi.mock("lodash/shuffle", () => ({ default: lodashAssignMocks.shuffle }));

const mockUser = User as any;

describe("UserService", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("assignReviewers", () => {
        describe("when there are enough TC reviewers", () => {
            it("should assign 2 reviewers from available TC users in bag", async () => {
                // Arrange
                const mockTCUsers = createMockTCUsers(5);
                mockUser.countDocuments.mockResolvedValue(5);
                mockUser.find.mockResolvedValue(mockTCUsers);
                mockUser.updateMany.mockResolvedValue({ acknowledged: true });

                // Mock lodash to return first 2 users predictably
                lodashAssignMocks.sampleSize.mockReturnValue([mockTCUsers[0], mockTCUsers[1]]);

                // Act
                const result = await UserService.assignReviewers("tc");

                // Assert
                expect(result).toHaveLength(2);
                expect(result[0]).toBe(mockTCUsers[0]);
                expect(result[1]).toBe(mockTCUsers[1]);
                expect(mockUser.countDocuments).toHaveBeenCalledWith({
                    groups: { $in: ["tc"] },
                    isActiveReviewer: true,
                });
                expect(mockUser.find).toHaveBeenCalledWith({
                    groups: { $in: ["tc"] },
                    isActiveReviewer: true,
                    inBag: true,
                });
                expect(mockUser.updateMany).toHaveBeenCalledWith(
                    { _id: { $in: [mockTCUsers[0]._id, mockTCUsers[1]._id] } },
                    { $set: { inBag: false } }
                );
            });

            it("should exclude specified users from assignment", async () => {
                // Arrange
                const mockTCUsers = createMockTCUsers(5);
                const usersToExclude = [mockTCUsers[0]._id.toString(), mockTCUsers[1]._id.toString()];

                mockUser.countDocuments.mockResolvedValue(3); // 5 total - 2 excluded
                mockUser.find.mockResolvedValue([mockTCUsers[2], mockTCUsers[3], mockTCUsers[4]]);
                mockUser.updateMany.mockResolvedValue({ acknowledged: true });

                lodashAssignMocks.sampleSize.mockReturnValue([mockTCUsers[2], mockTCUsers[3]]);

                // Act
                const result = await UserService.assignReviewers("tc", usersToExclude);

                // Assert
                expect(result).toHaveLength(2);
                expect(result[0]).toBe(mockTCUsers[2]);
                expect(result[1]).toBe(mockTCUsers[3]);
                expect(mockUser.countDocuments).toHaveBeenCalledWith({
                    groups: { $in: ["tc"] },
                    isActiveReviewer: true,
                    _id: { $nin: usersToExclude.map((id) => new Types.ObjectId(id)) },
                });
                expect(mockUser.find).toHaveBeenCalledWith({
                    groups: { $in: ["tc"] },
                    isActiveReviewer: true,
                    _id: { $nin: usersToExclude.map((id) => new Types.ObjectId(id)) },
                    inBag: true,
                });
            });

            it("should reset bag when less than 2 users are available in bag", async () => {
                // Arrange
                const mockTCUsers = createMockTCUsers(5);
                const userInBag = [mockTCUsers[0]]; // Only 1 user in bag

                mockUser.countDocuments.mockResolvedValue(5);
                mockUser.find
                    .mockResolvedValueOnce(userInBag) // First call returns 1 user
                    .mockResolvedValueOnce(mockTCUsers); // Second call after reset returns all users
                mockUser.updateMany.mockResolvedValue({ acknowledged: true });

                lodashAssignMocks.sampleSize.mockReturnValue([mockTCUsers[1]]);

                // Act
                const result = await UserService.assignReviewers("tc");

                // Assert
                expect(result).toHaveLength(2);
                expect(result[0]).toBe(mockTCUsers[0]); // First user from bag
                expect(result[1]).toBe(mockTCUsers[1]); // Second user from sampleSize
                expect(mockUser.updateMany).toHaveBeenCalledTimes(2);
                // First call to reset bag (excluding the user that was already selected)
                expect(mockUser.updateMany).toHaveBeenNthCalledWith(
                    1,
                    {
                        groups: { $in: ["tc"] },
                        isActiveReviewer: true,
                        _id: { $nin: [new Types.ObjectId(mockTCUsers[0].id)] },
                    },
                    { $set: { inBag: true } }
                );
                // Second call to mark selected users as out of bag
                expect(mockUser.updateMany).toHaveBeenNthCalledWith(
                    2,
                    { _id: { $in: [mockTCUsers[0]._id, mockTCUsers[1]._id] } },
                    { $set: { inBag: false } }
                );
            });

            it("should reset bag with exclusions when less than 2 users are available in bag", async () => {
                // Arrange
                const mockTCUsers = createMockTCUsers(5);
                const usersToExclude = [mockTCUsers[0]._id.toString()];
                const userInBag = [mockTCUsers[1]]; // Only 1 user in bag (excluding the first)
                const availableAfterReset = [mockTCUsers[1], mockTCUsers[2], mockTCUsers[3], mockTCUsers[4]];

                mockUser.countDocuments.mockResolvedValue(4); // 5 total - 1 excluded
                mockUser.find
                    .mockResolvedValueOnce(userInBag) // First call returns 1 user
                    .mockResolvedValueOnce(availableAfterReset); // Second call after reset
                mockUser.updateMany.mockResolvedValue({ acknowledged: true });

                lodashAssignMocks.sampleSize.mockReturnValue([mockTCUsers[2]]);

                // Act
                const result = await UserService.assignReviewers("tc", usersToExclude);

                // Assert
                expect(result).toHaveLength(2);
                expect(result[0]).toBe(mockTCUsers[1]); // First user from bag
                expect(result[1]).toBe(mockTCUsers[2]); // Second user from sampleSize
                expect(mockUser.updateMany).toHaveBeenCalledTimes(2);
                // First call to reset bag (with exclusions)
                expect(mockUser.updateMany).toHaveBeenNthCalledWith(
                    1,
                    {
                        groups: { $in: ["tc"] },
                        isActiveReviewer: true,
                        _id: { $nin: usersToExclude.map((id) => new Types.ObjectId(id)) },
                    },
                    { $set: { inBag: true } }
                );
                // Second call to mark selected users as out of bag
                expect(mockUser.updateMany).toHaveBeenNthCalledWith(
                    2,
                    { _id: { $in: [mockTCUsers[1]._id, mockTCUsers[2]._id] } },
                    { $set: { inBag: false } }
                );
            });
        });

        describe("when there are not enough reviewers", () => {
            it("should return empty array when total TC count is less than 2", async () => {
                // Arrange
                mockUser.countDocuments.mockResolvedValue(1); // Only 1 TC user available

                // Act
                const result = await UserService.assignReviewers("tc");

                // Assert
                expect(result).toEqual([]);
                expect(mockUser.find).not.toHaveBeenCalled();
                expect(mockUser.updateMany).not.toHaveBeenCalled();
            });

            it("should return empty array when total available count after exclusions is less than 2", async () => {
                // Arrange
                const mockTCUsers = createMockTCUsers(3);
                const usersToExclude = [mockTCUsers[0]._id.toString(), mockTCUsers[1]._id.toString()];

                mockUser.countDocuments.mockResolvedValue(1); // 3 total - 2 excluded = 1

                // Act
                const result = await UserService.assignReviewers("tc", usersToExclude);

                // Assert
                expect(result).toEqual([]);
                expect(mockUser.countDocuments).toHaveBeenCalledWith({
                    groups: { $in: ["tc"] },
                    isActiveReviewer: true,
                    _id: { $nin: usersToExclude.map((id) => new Types.ObjectId(id)) },
                });
                expect(mockUser.find).not.toHaveBeenCalled();
                expect(mockUser.updateMany).not.toHaveBeenCalled();
            });
        });

        describe("when working with CC reviewers", () => {
            it("should assign 2 reviewers from available CC users", async () => {
                // Arrange
                const mockCCUsers = createMockCCUsers(4);
                mockUser.countDocuments.mockResolvedValue(4);
                mockUser.find.mockResolvedValue(mockCCUsers);
                mockUser.updateMany.mockResolvedValue({ acknowledged: true });

                lodashAssignMocks.sampleSize.mockReturnValue([mockCCUsers[0], mockCCUsers[1]]);

                // Act
                const result = await UserService.assignReviewers("cc");

                // Assert
                expect(result).toHaveLength(2);
                expect(result[0]).toBe(mockCCUsers[0]);
                expect(result[1]).toBe(mockCCUsers[1]);
                expect(mockUser.countDocuments).toHaveBeenCalledWith({
                    groups: { $in: ["cc"] },
                    isActiveReviewer: true,
                });
                expect(mockUser.find).toHaveBeenCalledWith({
                    groups: { $in: ["cc"] },
                    isActiveReviewer: true,
                    inBag: true,
                });
            });

            it("should exclude specified CC users from assignment", async () => {
                // Arrange
                const mockCCUsers = createMockCCUsers(4);
                const usersToExclude = [mockCCUsers[0]._id.toString()];

                mockUser.countDocuments.mockResolvedValue(3); // 4 total - 1 excluded
                mockUser.find.mockResolvedValue([mockCCUsers[1], mockCCUsers[2], mockCCUsers[3]]);
                mockUser.updateMany.mockResolvedValue({ acknowledged: true });

                lodashAssignMocks.sampleSize.mockReturnValue([mockCCUsers[1], mockCCUsers[2]]);

                // Act
                const result = await UserService.assignReviewers("cc", usersToExclude);

                // Assert
                expect(result).toHaveLength(2);
                expect(result[0]).toBe(mockCCUsers[1]);
                expect(result[1]).toBe(mockCCUsers[2]);
                expect(mockUser.countDocuments).toHaveBeenCalledWith({
                    groups: { $in: ["cc"] },
                    isActiveReviewer: true,
                    _id: { $nin: usersToExclude.map((id) => new Types.ObjectId(id)) },
                });
            });
        });

        describe("edge cases", () => {
            it("should handle empty usersToExclude array", async () => {
                // Arrange
                const mockTCUsers = createMockTCUsers(3);
                mockUser.countDocuments.mockResolvedValue(3);
                mockUser.find.mockResolvedValue(mockTCUsers);
                mockUser.updateMany.mockResolvedValue({ acknowledged: true });

                lodashAssignMocks.sampleSize.mockReturnValue([mockTCUsers[0], mockTCUsers[1]]);

                // Act
                const result = await UserService.assignReviewers("tc", []);

                // Assert
                expect(result).toHaveLength(2);
                expect(mockUser.countDocuments).toHaveBeenCalledWith({
                    groups: { $in: ["tc"] },
                    isActiveReviewer: true,
                });
            });

            it("should handle when all eligible users are excluded", async () => {
                // Arrange
                const mockTCUsers = createMockTCUsers(2);
                const usersToExclude = [mockTCUsers[0]._id.toString(), mockTCUsers[1]._id.toString()];

                mockUser.countDocuments.mockResolvedValue(0); // All users excluded

                // Act
                const result = await UserService.assignReviewers("tc", usersToExclude);

                // Assert
                expect(result).toEqual([]);
                expect(mockUser.countDocuments).toHaveBeenCalledWith({
                    groups: { $in: ["tc"] },
                    isActiveReviewer: true,
                    _id: { $nin: usersToExclude.map((id) => new Types.ObjectId(id)) },
                });
            });

            it("should handle inactive reviewers being excluded from the pool", async () => {
                // Arrange
                const activeTCUsers = createMockTCUsers(2, true); // active reviewers

                mockUser.countDocuments.mockResolvedValue(2); // Only active reviewers counted
                mockUser.find.mockResolvedValue(activeTCUsers); // Only active reviewers returned
                mockUser.updateMany.mockResolvedValue({ acknowledged: true });

                lodashAssignMocks.sampleSize.mockReturnValue(activeTCUsers);

                // Act
                const result = await UserService.assignReviewers("tc");

                // Assert
                expect(result).toHaveLength(2);
                expect(result).toEqual(activeTCUsers);
                // Verify that the query filters for isActiveReviewer: true
                expect(mockUser.countDocuments).toHaveBeenCalledWith({
                    groups: { $in: ["tc"] },
                    isActiveReviewer: true,
                });
                expect(mockUser.find).toHaveBeenCalledWith({
                    groups: { $in: ["tc"] },
                    isActiveReviewer: true,
                    inBag: true,
                });
            });
        });
    });
});
