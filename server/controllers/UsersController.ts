import { IUser, UserListQuery } from "../../interfaces/User";
import User from "../models/userModel";
import helpers from "../helpers";
import UserService from "../services/UserService";
import DiscordService from "../services/DiscordService";
import webhookColors from "../constants/webhookColors";
import LogService from "../services/LogService";
import { Request, Response } from "express";

class UsersController {
    /** GET logged in user */
    public getSelf(_: Request, res: Response) {
        const user = res.locals!.user!;
        res.json(user);
    }

    /** GET users listing */
    public async index(req: Request, res: Response) {
        const reqQuery = req.query as UserListQuery;

        if (!reqQuery.userInput) {
            return res.json([]);
        }

        let users: IUser[] = [];

        if (helpers.isValidMongoId(reqQuery.userInput)) {
            const user = await User.findById(reqQuery.userInput);
            if (user) users.push(user);
        } else if (helpers.isNumeric(reqQuery.userInput)) {
            const user = await User.findOne({ osuId: parseInt(reqQuery.userInput, 10) });
            if (user) users.push(user);
        } else {
            users = await User.find({ username: { $regex: reqQuery.userInput, $options: "i" } });
        }

        res.json(reqQuery.limit ? users.slice(0, parseInt(reqQuery.limit, 10)) : users);
    }

    /** GET a user */
    public async getUser(req: Request, res: Response) {
        const userInput = req.params.userInput;

        const user = await User.findByUsernameOrOsuId(userInput);

        if (!user) {
            return res.json({ error: "User not found" });
        }

        res.json(user);
    }

    /** GET users in a committee */
    public async getCommittee(req: Request, res: Response) {
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
    public async create(req: Request, res: Response) {
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

        res.json({ message: "User created successfully!", user });
    }

    /** POST toggle isActiveReviewer */
    public async toggleReviewerStatus(req: Request, res: Response): Promise<void> {
        const { userId } = req.params;

        const user = await User.findById(userId).orFail();

        user.isActiveReviewer = !user.isActiveReviewer;
        await user.save();

        await LogService.generate(
            req.session.mongoId!,
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

        res.json({ message: `Set reviewer status as ${user.isActiveReviewer ? "active" : "inactive"} successfully!`, user });
    }
}

export default new UsersController();
