import { IUser, UserGroup } from "@tc/types/User";
import { IOsuCountry } from "@tc/types/OsuApi";
import { Types } from "mongoose";

/**
 * Creates a mock user object for testing purposes.
 * This is a simplified mock that focuses on the properties needed for testing
 * the UserService.assignReviewers method.
 * @param overrides - Partial properties to override in the mock user
 * @returns A mock user object with default values and overrides applied
 */
export function createMockUser(overrides: Partial<IUser> = {}): IUser {
    const _id = new Types.ObjectId();
    const defaultUser = {
        _id,
        id: _id.toString(),
        osuId: Math.floor(Math.random() * 1000000) + 1000,
        username: `TestUser${Math.floor(Math.random() * 1000)}`,
        groups: ["user"] as UserGroup[],
        history: [],
        isActiveReviewer: false,
        isActiveVoter: false,
        inBag: true,
        badgeValue: 0,
        country: {
            code: "US",
            name: "United States",
        } as IOsuCountry,
        coverUrl: "https://example.com/cover.jpg",
        createdAt: new Date(),
        updatedAt: new Date(),

        // Mock virtuals
        avatarUrl: "https://example.com/avatar.jpg",
        osuProfileUrl: `https://osu.ppy.sh/users/${Math.floor(Math.random() * 1000000) + 1000}`,
        isTournamentCommittee: false,
        isContestCommittee: false,
        isAdmin: false,
        isDev: false,
        isAlumni: false,
        isCommittee: false,
        tcDuration: 0,
        ccDuration: 0,

        ...overrides,
    } as IUser;

    // Update computed virtuals based on groups
    const user = defaultUser as any;
    if (defaultUser.groups.includes("tc")) {
        user.isTournamentCommittee = true;
        user.isCommittee = true;
    }
    if (defaultUser.groups.includes("cc")) {
        user.isContestCommittee = true;
        user.isCommittee = true;
    }
    if (defaultUser.groups.includes("admin")) {
        user.isAdmin = true;
        user.isCommittee = true;
    }
    if (defaultUser.groups.includes("alm")) {
        user.isAlumni = true;
    }
    if (defaultUser.groups.includes("dev")) {
        user.isDev = true;
        user.isCommittee = true;
    }

    return defaultUser;
}

/**
 * Creates multiple mock users with different configurations for testing.
 * @param count - Number of users to create
 * @param baseOverrides - Base overrides to apply to all users
 * @returns Array of mock users
 */
export function createMockUsers(count: number, baseOverrides: Partial<IUser> = {}): IUser[] {
    return Array.from({ length: count }, (_, index) =>
        createMockUser({
            ...baseOverrides,
            username: `TestUser${index + 1}`,
            osuId: 1000 + index + 1,
        }),
    );
}

/**
 * Creates mock TC (Tournament Committee) users for testing.
 * @param count - Number of TC users to create
 * @param activeReviewers - Whether users should be active reviewers (default: true)
 * @returns Array of mock TC users
 */
export function createMockTCUsers(count: number, activeReviewers: boolean = true): IUser[] {
    return createMockUsers(count, {
        groups: ["tc"],
        isActiveReviewer: activeReviewers,
        inBag: true,
    });
}

/**
 * Creates mock CC (Contest Committee) users for testing.
 * @param count - Number of CC users to create
 * @param activeReviewers - Whether users should be active reviewers (default: true)
 * @returns Array of mock CC users
 */
export function createMockCCUsers(count: number, activeReviewers: boolean = true): IUser[] {
    return createMockUsers(count, {
        groups: ["cc"],
        isActiveReviewer: activeReviewers,
        inBag: true,
    });
}
