import User from "../models/userModel";
import isEqual from "lodash/isEqual.js";
import sampleSize from "lodash/sampleSize.js";
import shuffle from "lodash/shuffle.js";
import { IUser, UserGroup } from "@tc/types/User";
import { IOsuUser } from "@tc/types/OsuApi";
import OsuApiService from "./OsuApiService";
import LogService from "./LogService";
import { Document, Types } from "mongoose";

class UserService {
    /**
     *  Create or update a user based on an osu! API response
     * @param userResponse - osu! API response
     * @param existingUser - optional existing user to update
     */
    public async createOrUpdateUser(
        userResponse: IOsuUser,
        existingUser: (Document & IUser) | null = null,
    ): Promise<Document & IUser> {
        const osuId = userResponse.id;
        const username = userResponse.username;
        const groups = ["user"];
        const coverUrl = userResponse.cover.url;
        const country = userResponse.country;
        const osuGroups = userResponse.groups?.map((group) => group.id);

        let user = existingUser;

        if (!user) {
            user = new User({
                osuId,
                username,
                groups,
                coverUrl,
                country,
            });

            await user.save();
            LogService.generate(user.id, "Verified their account for the first time", "account");
        } else {
            let saveTrigger = false;
            let oldUsername: string | undefined;

            if (user.username !== username) {
                oldUsername = user.username;
                user.username = username;
                saveTrigger = true;
            }

            if (user.coverUrl !== coverUrl) {
                user.coverUrl = coverUrl;
                saveTrigger = true;
            }

            if (!isEqual(user.country, country)) {
                user.country = country;
                saveTrigger = true;
            }

            if (saveTrigger) {
                await user.save();

                if (oldUsername) {
                    LogService.generate(user.id, `Username changed from "${oldUsername}" to "${username}"`, "account");
                }
            }
        }

        // Mark non-committee users in dev usergroup as admin
        if (osuGroups?.includes(11) && !user.isCommitteeOrAdmin) {
            user.groups.push("admin");
            await user.save();
        }

        return user;
    }

    /** Find or create a user
     * @param accessToken - osu! API access token
     * @param userInput - osu! username or osu! ID
     */
    public async findOrCreateUser(accessToken: string, userInput: string | number): Promise<IUser | null> {
        const user = await User.findByUsernameOrOsuId(userInput);

        if (user) return user;

        const userResponse = await OsuApiService.getUserInfo(accessToken, userInput);

        if (OsuApiService.isOsuResponseError(userResponse)) {
            return null;
        }

        return this.createOrUpdateUser(userResponse);
    }

    /**
     * Assign reviewers via bag randomization
     * @param type - user group to assign reviewers from
     * @param usersToExclude - array of user IDs to exclude from assignment (e.g., tournament host, winners)
     * @returns - 2 randomly selected reviewers
     * * Main concept is to fetch all users who have isBag set to true, randomly pick 2, and set their isBag to false.
     * * If there's less than 2 users with isBag set to true, set all users' isBag to true.
     */
    public async assignReviewers(type: UserGroup, usersToExclude: string[] = []): Promise<IUser[]> {
        const baseQuery = {
            groups: { $in: [type] },
            isActiveReviewer: true,
        };

        // Convert string IDs to ObjectIds for MongoDB queries
        const excludeObjectIds = usersToExclude.map((id) => new Types.ObjectId(id));

        // Add exclusion filter if users to exclude are provided
        let excludeQuery = usersToExclude.length > 0 ? { ...baseQuery, _id: { $nin: excludeObjectIds } } : baseQuery;

        const totalUsersCount = await User.countDocuments(excludeQuery);

        if (totalUsersCount < 2) {
            // Not enough reviewers to assign
            return [];
        }

        let users = await User.find({
            ...excludeQuery,
            inBag: true,
        });

        const selectedUsers: IUser[] = [];

        if (users.length < 2) {
            // if there's 1 user, assign them and add them to the exclude list
            if (users.length === 1) {
                selectedUsers.push(users[0]);
                usersToExclude.push(users[0].id);
                // Re-convert updated exclude list to ObjectIds
                const updatedExcludeObjectIds = usersToExclude.map((id) => new Types.ObjectId(id));
                excludeQuery = { ...baseQuery, _id: { $nin: updatedExcludeObjectIds } };
            }

            // Reset only relevant users
            await User.updateMany(excludeQuery, { $set: { inBag: true } });

            // Refetch after reset
            users = await User.find({
                ...excludeQuery,
                inBag: true,
            });
        }

        // shuffle users to ensure random pairings
        const shuffledUsers = shuffle(users);

        selectedUsers.push(...sampleSize(shuffledUsers, selectedUsers.length === 0 ? 2 : 1));

        await User.updateMany({ _id: { $in: selectedUsers.map((user) => user._id) } }, { $set: { inBag: false } });

        return selectedUsers;
    }

    /**
     * * Removes the following from non-committee users:
     * * email
     * * infringements
     * @param targetUser - the user to sanitize
     * @param actor - the user who is receiving the user data
     * @returns the sanitized user
     */
    public sanitizeUser(targetUser: IUser, actor: IUser | undefined): IUser {
        if (!actor || !actor.isCommitteeOrAdmin) {
            targetUser.email = undefined;
            targetUser.infringements = [];
            targetUser.activeInfringement = undefined;
            targetUser.latestAction = undefined;
        }

        return targetUser;
    }
}

export default new UserService();
