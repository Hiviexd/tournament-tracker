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
    const groups: UserGroup[] = overrides.groups ?? ["user"];
    const country: IOsuCountry = {
        code: "US",
        name: "United States",
    };
    const osuId = overrides.osuId ?? Math.floor(Math.random() * 1000000) + 1000;
    const isTournamentCommittee = groups.includes("tc");
    const isContestCommittee = groups.includes("cc");
    const isAdmin = groups.includes("admin");
    const isDev = groups.includes("dev");
    const isAlumni = groups.includes("alm");
    const isCommittee = isTournamentCommittee || isContestCommittee || isAdmin || isDev;

    const defaultUser: IUser = {
        _id,
        id: _id.toString(),
        osuId,
        username: `TestUser${Math.floor(Math.random() * 1000)}`,
        groups,
        history: [],
        isActiveReviewer: false,
        isActiveVoter: false,
        inBag: true,
        badgeValue: 0,
        country,
        coverUrl: "https://example.com/cover.jpg",
        infringements: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        avatarUrl: "https://example.com/avatar.jpg",
        osuProfileUrl: `https://osu.ppy.sh/users/${osuId}`,
        isTournamentCommittee,
        isContestCommittee,
        isAdmin,
        isDev,
        isAlumni,
        isCommittee,
        isCommitteeOrAdmin: isCommittee || isAdmin,
        tcDuration: 0,
        ccDuration: 0,
        ...overrides,
    };

    defaultUser.isTournamentCommittee = defaultUser.groups.includes("tc");
    defaultUser.isContestCommittee = defaultUser.groups.includes("cc");
    defaultUser.isAdmin = defaultUser.groups.includes("admin");
    defaultUser.isAlumni = defaultUser.groups.includes("alm");
    defaultUser.isDev = defaultUser.groups.includes("dev");
    defaultUser.isCommittee =
        defaultUser.isTournamentCommittee || defaultUser.isContestCommittee || defaultUser.isAdmin || defaultUser.isDev;
    defaultUser.isCommitteeOrAdmin = defaultUser.isCommittee || defaultUser.isAdmin;

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
