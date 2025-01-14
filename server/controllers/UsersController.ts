import { IUser } from "../../interfaces/User";
import User from "../models/userModel";
import helpers from "../helpers";
import UserService from "../services/UserService";
import DiscordService from "../services/DiscordService";
import webhookColors from "../helpers/constants/webhookColors";
import LogService from "../services/LogService";

class UsersController {
    /** GET logged in user */
    public getSelf(_, res): void {
        const user = res.locals.user;
        res.json(user);
    }

    /** GET users listing */
    public async index(req, res): Promise<void> {
        const { userInput, limit } = req.query;

        if (!userInput) {
            return res.json([]);
        }

        let users: IUser[] = [];

        if (helpers.isValidMongoId(userInput)) {
            const user = await User.findById(userInput);
            if (user) users.push(user);
        } else if (!isNaN(userInput)) {
            const user = await User.findOne({ osuId: userInput });
            if (user) users.push(user);
        } else {
            users = await User.find({ username: { $regex: userInput, $options: "i" } });
        }

        res.json(limit ? users.slice(0, parseInt(limit, 10)) : users);
    }

    /** GET a user */
    public async getUser(req, res): Promise<void> {
        const userInput = req.params.userInput;

        const user = await User.findByUsernameOrOsuId(userInput);

        if (!user) {
            return res.json({ error: "User not found" });
        }

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

    /** POST create a user */
    public async create(req, res): Promise<void> {
        const { userInput } = req.body;

        const user = await UserService.findOrCreateUser(req.session.accessToken!, userInput);

        if (!user) {
            return res.json({ error: "User not found" });
        }

        await DiscordService.sendWebhook(
            [
                {
                    author: DiscordService.defaultWebhookAuthor(req.session),
                    color: webhookColors.blue,
                    description: `Added new user **[${user.username}](https://osu.ppy.sh/users/${user.osuId})** to the database`,
                },
            ],
            undefined,
            undefined,
            "dev"
        );

        res.json(user);
    }

    /** POST toggle isActiveReviewer */
    public async toggleReviewerStatus(req, res): Promise<void> {
        const { userId } = req.params;

        const user = await User.findById(userId).orFail();

        user.isActiveReviewer = !user.isActiveReviewer;
        await user.save();

        await LogService.generate(
            req.session.mongoId,
            `Toggled reviewer status for [**${user.username}**](https://osu.ppy.sh/users/${user.osuId}) to **${user.isActiveReviewer}**`,
            "user"
        );

        await DiscordService.sendWebhook([
            {
                author: DiscordService.defaultWebhookAuthor(req.session),
                color: webhookColors.orange,
                description: `Marked [**${user.username}**](https://osu.ppy.sh/users/${
                    user.osuId
                }) as **${user.isActiveReviewer ? "active" : "inactive"}** reviewer`,
            },
        ]);

        res.json(user);
    }
}

export default new UsersController();
