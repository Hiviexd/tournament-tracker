import { IUser, UserListQuery } from "../../interfaces/User";
import User from "../models/userModel";
import helpers from "../helpers";
import UserService from "../services/UserService";
import DiscordService from "../services/DiscordService";
import OsuApiService from "../services/OsuApiService";
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

        let userInput = reqQuery.userInput;

        if (userInput && helpers.validateOsuProfileLink(userInput)) {
            userInput = helpers.validateOsuProfileLink(userInput)!;
        }

        if (!userInput) {
            return res.json([]);
        }

        let users: IUser[] = [];

        if (helpers.isValidMongoId(userInput)) {
            const user = await User.findById(userInput);
            if (user) users.push(user);
        } else if (helpers.isNumeric(userInput)) {
            const user = await User.findOne({ osuId: parseInt(userInput, 10) });
            if (user) users.push(user);
        } else {
            users = await User.find({ username: { $regex: userInput, $options: "i" } });
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
        const includeAlumni = req.query.includeAlumni === "true" || false;

        let query;

        switch (type) {
            case "tc":
                query = { groups: "tc" };
                break;
            case "cc":
                query = { groups: "cc" };
                break;
            default:
                query = includeAlumni ? { groups: { $in: ["tc", "cc", "alm"] } } : { groups: { $in: ["tc", "cc"] } };
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
                description: `Marked [**${user.username}**](https://osu.ppy.sh/users/${user.osuId}) as **${
                    user.isActiveReviewer ? "active" : "inactive"
                }** reviewer`,
            },
        ]);

        res.json({
            message: `Set reviewer status as ${user.isActiveReviewer ? "active" : "inactive"} successfully!`,
            user,
        });
    }

    /** POST update user group */
    public async updateUserGroups(req: Request, res: Response) {
        const { userId } = req.params;
        const { group, join } = req.body;

        // Validate input
        if (!["tc", "cc"].includes(group)) {
            return res.json({ error: "Invalid group" });
        }

        const user = await User.findById(userId).orFail();

        if (join) {
            // Add to group if not already in it
            if (!user.groups.includes(group)) {
                user.groups.push(group);
            }

            user.groups = user.groups.filter((g) => g !== "alm");
        } else {
            // Remove from group
            user.groups = user.groups.filter((g) => g !== group);

            // Add to alumni if removing from last committee
            if (!user.groups.some((g) => ["tc", "cc"].includes(g)) && !user.groups.includes("alm")) {
                user.groups.push("alm");
            }
        }

        await user.save();

        // Create history entry
        const historyEntry = {
            date: new Date(),
            group,
            kind: join ? "join" : ("leave" as "join" | "leave"),
        };

        user.history.push(historyEntry);
        await user.save();

        // Logger
        await LogService.generate(
            req.session.mongoId!,
            `${join ? "Added" : "Removed"} [**${user.username}**](https://osu.ppy.sh/users/${user.osuId}) ${
                join ? "to" : "from"
            } **${group.toUpperCase()}**`,
            "user"
        );

        // Discord webhook
        await DiscordService.sendWebhook([
            {
                author: DiscordService.defaultWebhookAuthor(req.session),
                color: join ? webhookColors.green : webhookColors.red,
                description: `${join ? "Added" : "Removed"} [**${user.username}**](https://osu.ppy.sh/users/${
                    user.osuId
                }) ${join ? "to" : "from"} **${group.toUpperCase()}**`,
            },
        ]);

        res.json({
            message: `User ${join ? "added to" : "removed from"} ${group.toUpperCase()} successfully!`,
            user,
        });
    }

    /** POST update user badge value */
    public async updateBadge(req: Request, res: Response) {
        const { userId } = req.params;
        const { increment } = req.body;

        const user = await User.findById(userId).orFail();
        const oldValue = user.badgeValue;

        // Update badge value
        if (increment && user.badgeValue < 10) {
            user.badgeValue++;
        } else if (!increment && user.badgeValue > 0) {
            user.badgeValue--;
        } else {
            return res.json({
                error: increment ? "Badge value cannot exceed 10" : "Badge value cannot be less than 0",
            });
        }

        await user.save();

        // Log the change
        await LogService.generate(
            req.session.mongoId!,
            `Changed [**${user.username}**](https://osu.ppy.sh/users/${user.osuId})'s badge level from **${oldValue}** to **${user.badgeValue}**`,
            "user"
        );

        // Discord webhook notification
        await DiscordService.sendWebhook([
            {
                author: DiscordService.defaultWebhookAuthor(req.session),
                color: webhookColors.orange,
                description: `Changed [**${user.username}**](https://osu.ppy.sh/users/${user.osuId})'s badge level from **${oldValue}** to **${user.badgeValue}**`,
            },
        ]);

        return res.json({
            message: `Badge level updated to ${user.badgeValue}`,
            user,
        });
    }

    /** POST sync user data with osu! */
    public async syncUser(req: Request, res: Response) {
        const { userId } = req.params;
        const user = await User.findById(userId).orFail();

        const userResponse = await OsuApiService.getUserInfo(req.session.accessToken!, user.osuId);

        if (OsuApiService.isOsuResponseError(userResponse)) {
            return res.json({ error: "Failed to fetch user data from osu!" });
        }

        const updatedUser = await UserService.createOrUpdateUser(userResponse, user);

        res.json({
            message: "User data synced successfully!",
            user: updatedUser,
        });
    }

    /** POST update discord ID */
    public async updateDiscordId(req: Request, res: Response) {
        const userId = req.params.userId;
        const { discordId } = req.body;

        const user = await User.findById(userId).orFail();

        if (Number.isNaN(Number(discordId))) {
            return res.json({ error: "Invalid Discord ID!" });
        }

        user.discordId = Number(discordId);
        await user.save();

        await LogService.generate(
            req.session.mongoId!,
            `Updated Discord ID for [**${user.username}**](https://osu.ppy.sh/users/${user.osuId})`,
            "user"
        );

        res.json({
            message: `Updated Discord ID successfully!`,
            user,
        });
    }
}

export default new UsersController();
