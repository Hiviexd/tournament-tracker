import User from "../models/userModel";
import _ from "lodash";
import { IUser, UserGroup } from "../../interfaces/User";
import { IOsuUser } from "../../interfaces/OsuApi";
import OsuApi from "helpers/classes/OsuApi";

class UsersController {
    // ? Util methods
    /** Create or update a user based on an osu! API response */
    public async createOrUpdateUser(userResponse: IOsuUser): Promise<IUser> {
        const osuId = userResponse.id;
        const username = userResponse.username;
        const groups = [UserGroup.User];
        const coverUrl = userResponse.cover.url;
        const country = userResponse.country;

        let user = await User.findOne({ osuId });

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
    public async findOrCreateUser(accessToken, userInput): Promise<IUser | null> {
        const user = await User.findByUsernameOrOsuId(userInput);

        if (user) return user;

        const userResponse = await OsuApi.getUserInfo(accessToken, userInput);

        if (OsuApi.isOsuResponseError(userResponse)) {
            return null;
        }

        return this.createOrUpdateUser(userResponse);
    }

    // ? Route methods
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
            case UserGroup.Tournaments:
                query = { groups: UserGroup.Tournaments };
                break;
            case UserGroup.Contests:
                query = { groups: UserGroup.Contests };
                break;
            default:
                query = { groups: { $in: [UserGroup.Tournaments, UserGroup.Contests] } };
        }

        const committee = await User.find(query).orFail();

        res.json(committee);
    }
}

export default new UsersController();
