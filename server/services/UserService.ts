import User from "../models/userModel";
import _ from "lodash";
import { IUser, UserGroup } from "../../interfaces/User";
import { IOsuUser } from "../../interfaces/OsuApi";
import OsuApiService from "./OsuApiService";
import LogService from "./LogService";

class UserService {
    /**
     *  Create or update a user based on an osu! API response
     * @param userResponse - osu! API response
     * @param existingUser - optional existing user to update
     */
    public async createOrUpdateUser(userResponse: IOsuUser, existingUser: IUser | null = null): Promise<IUser> {
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

            if (!_.isEqual(user.country, country)) {
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
        if (osuGroups?.includes(11) && !user.isCommittee && !user.isAdmin) {
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
     * @returns - 2 randomly selected reviewers
     * * Main concept is to fetch all users who have isBag set to true, randomly pick 2, and set their isBag to false.
     * * If there's less than 2 users with isBag set to true, set all users' isBag to true.
     */
    public async assignReviewers(type: UserGroup): Promise<IUser[]> {
        const users = await User.find({
            groups: { $in: [type] },
            isActiveReviewer: true,
            inBag: true,
        }).orFail();

        // get count of total users in groups
        const totalUsersCount = await User.countDocuments({
            groups: { $in: [type] },
            isActiveReviewer: true,
        });

        // safer check if there's less than 2 active users in the group
        if (users.length < _.min([2, totalUsersCount])) {
            await User.updateMany({}, { $set: { inBag: true } });

            // refetch users
            return this.assignReviewers(type);
        }

        const selectedUsers: IUser[] = _.sampleSize(users, 2);

        await User.updateMany({ _id: { $in: selectedUsers.map((user) => user._id) } }, { $set: { inBag: false } });

        return selectedUsers;
    }
}

export default new UserService();
