import User from "../models/userModel";
import _ from "lodash";
import { IUser, UserGroup } from "../../interfaces/User";
import { IOsuUser } from "../../interfaces/OsuApi";
import OsuApi from "helpers/classes/OsuApi";

class UsersController {
    // ? Util methods
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
        } else {
            let saveTrigger = false;

            if (user.username !== username) {
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
            }
        }

        return user;
    }

    /** Find or create a user */
    public async findOrCreateUser(accessToken: string, userInput: string | number): Promise<IUser | null> {
        const user = await User.findByUsernameOrOsuId(userInput);

        if (user) return user;

        const userResponse = await OsuApi.getUserInfo(accessToken, userInput);

        if (OsuApi.isOsuResponseError(userResponse)) {
            return null;
        }

        return this.createOrUpdateUser(userResponse);
    }

    /**
     * Assign reviewers via bag randomization
     * * Main concept is to fetch all users who have isBag set to true, randomly pick 2, and set their isBag to false.
     * * If there's less than 2 users with isBag set to true, set all users' isBag to true.
     */
    public async assignReviewers(type: UserGroup): Promise<IUser[]> {
        const users = await User.find({
            groups: { $in: [type] },
            isActive: true,
            inBag: true,
        }).orFail();

        // get count of total users in groups
        const totalUsersCount = await User.countDocuments({
            groups: { $in: [type] },
            isActive: true,
        });

        // safer check if there's less than 2 active users in the group
        if (users.length < _.min([2, totalUsersCount])) {
            await User.updateMany({}, { $set: { inBag: true } });

            // refetch users
            return this.assignReviewers(type);
        }

        const selectedUsers: IUser[] = _.sampleSize(users, 2);

        await User.updateMany(
            { _id: { $in: selectedUsers.map(user => user._id) } },
            { $set: { inBag: false } }
        );

        return selectedUsers;
    }

    // ? API methods
    /** GET logged in user */
    public getSelf(_, res): void {
        const user = res.locals.user;
        res.json(user);
    }

    /** GET a user */
    public async getUser(req, res): Promise<void> {
        const userInput = req.params.userInput;

        const user = await User.findByUsernameOrOsuId(userInput).orFail();

        res.json(user);
    }

    /** GET users in a committee */
    public async getCommittee(req, res): Promise<void> {
        const type = req.query.type;
        let query;

        switch (type) {
            case "tc":
                query = { groups: "tc" };
                break;
            case "cc":
                query = { groups: "cc" };
                break;
            default:
                query = { groups: { $in: ["tc", "cc"] } };
        }

        const committee = await User.find(query).orFail();

        res.json(committee);
    }
}

export default new UsersController();
