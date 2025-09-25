import { InfringementType, IUser, UserListQuery, WatchlistQuery } from "../../interfaces/User";
import User from "../models/userModel";
import utils from "../../utils";
import UserService from "../services/UserService";
import DiscordService from "../services/DiscordService";
import OsuApiService from "../services/OsuApiService";
import webhookColors from "../constants/webhookColors";
import LogService from "../services/LogService";
import { Request, Response } from "express";
import Tournament from "../models/tournamentModel";

class UsersController {
    /** GET logged in user */
    public getSelf(_: Request, res: Response) {
        const user = res.locals!.user!;
        res.json(user);
    }

    /** GET users listing */
    public async index(req: Request, res: Response) {
        const reqQuery = req.query as UserListQuery;
        const currentUser = res.locals!.user;

        let userInput = reqQuery.userInput;

        if (userInput && utils.validateOsuProfileLink(userInput)) {
            userInput = utils.validateOsuProfileLink(userInput)!;
        }

        if (!userInput) {
            return res.status(400).json([]);
        }

        userInput = utils.escapeUsername(userInput);

        let users: IUser[] = [];

        if (utils.isValidMongoId(userInput)) {
            const user = await User.findById(userInput);
            if (user) users.push(user);
        } else if (utils.isNumeric(userInput)) {
            const user = await User.findOne({ osuId: parseInt(userInput, 10) });
            if (user) users.push(user);
        } else {
            users = await User.find({ username: { $regex: userInput, $options: "i" } });
        }

        const sanitizedUsers = users.map((user) => UserService.sanitizeUser(user, currentUser));

        res.json(reqQuery.limit ? sanitizedUsers.slice(0, parseInt(reqQuery.limit, 10)) : sanitizedUsers);
    }

    /** GET a user */
    public async getUser(req: Request, res: Response) {
        const userInput = req.params.userInput;
        const currentUser = res.locals!.user;

        const user = await User.findByUsernameOrOsuId(userInput);

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const sanitizedUser = UserService.sanitizeUser(user, currentUser);

        res.json(sanitizedUser);
    }

    /** GET osu! user info */
    public async getOsuUserInfo(req: Request, res: Response) {
        const userInput = req.params.userInput;

        const user = await OsuApiService.getUserInfo(req.session.accessToken!, userInput);

        if (OsuApiService.isOsuResponseError(user)) {
            return res.status(404).json({ error: "osu! user not found!" });
        }

        res.json(user);
    }

    /** GET users in a committee */
    public async getCommittee(req: Request, res: Response) {
        const type = req.query.type;
        const includeAlumni = req.query.includeAlumni === "true" || false;
        const currentUser = res.locals!.user;

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

        const sanitizedCommittee = committee.map((user) => UserService.sanitizeUser(user, currentUser));

        res.json(sanitizedCommittee);
    }

    /** POST create a user */
    public async create(req: Request, res: Response) {
        const { userInput } = req.body;

        const user = await UserService.findOrCreateUser(req.session.accessToken!, userInput);

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        await DiscordService.sendWebhook({
            embeds: [
                {
                    author: DiscordService.defaultWebhookAuthor(req.session),
                    color: webhookColors.blue,
                    description: `Added new user **[${user.username}](https://osu.ppy.sh/users/${user.osuId})** to the database`,
                },
            ],
            webhook: "dev",
        });

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
            `Toggled activity status for [**${user.username}**](https://osu.ppy.sh/users/${user.osuId}) to **${user.isActiveReviewer}**`,
            "user"
        );

        await DiscordService.sendWebhook({
            embeds: [
                {
                    author: DiscordService.defaultWebhookAuthor(req.session),
                    color: webhookColors.orange,
                    description: `Marked [**${user.username}**](https://osu.ppy.sh/users/${user.osuId}) as **${
                        user.isActiveReviewer ? "active" : "inactive"
                    }** reviewer`,
                },
            ],
        });

        res.json({
            message: `Set activity status as ${user.isActiveReviewer ? "active" : "inactive"}!`,
            user,
        });
    }

    /** POST update user group */
    public async updateUserGroups(req: Request, res: Response) {
        const { userId } = req.params;
        const { group, join } = req.body;

        // Validate input
        if (!["tc", "cc"].includes(group)) {
            return res.status(400).json({ error: "Invalid group" });
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

        const groupName = group === "tc" ? "Tournament Committee" : "Contest Committee";

        // Logger
        await LogService.generate(
            req.session.mongoId!,
            `${join ? "Added" : "Removed"} [**${user.username}**](https://osu.ppy.sh/users/${user.osuId}) ${
                join ? "to" : "from"
            } the **${groupName}**`,
            "user"
        );

        // Discord webhook
        await DiscordService.sendWebhook({
            embeds: [
                {
                    author: DiscordService.defaultWebhookAuthor(req.session),
                    color: join ? webhookColors.lightGreen : webhookColors.lightRed,
                    description: `${join ? "Added" : "Removed"} [**${user.username}**](https://osu.ppy.sh/users/${
                        user.osuId
                    }) ${join ? "to" : "from"} the **${groupName}**`,
                },
            ],
        });

        res.json({
            message: `User ${join ? "added to" : "removed from"} the **${groupName}** successfully!`,
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
            return res.status(400).json({
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
        await DiscordService.sendWebhook({
            embeds: [
                {
                    author: DiscordService.defaultWebhookAuthor(req.session),
                    color: webhookColors.orange,
                    description: `Changed [**${user.username}**](https://osu.ppy.sh/users/${user.osuId})'s badge level from **${oldValue}** to **${user.badgeValue}**`,
                },
            ],
        });

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
            return res.status(502).json({ error: "Failed to fetch user data from osu!" });
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
            return res.status(400).json({ error: "Invalid Discord ID!" });
        }

        user.discordId = discordId;
        await user.save();

        await LogService.generate(
            req.session.mongoId!,
            `Updated Discord ID for [**${user.username}**](https://osu.ppy.sh/users/${user.osuId}) to ${discordId}`,
            "user"
        );

        res.json({
            message: `Updated Discord ID successfully!`,
            user,
        });
    }

    /** POST update user email */
    public async updateEmail(req: Request, res: Response) {
        const { userId } = req.params;
        const { email } = req.body;

        const user = await User.findById(userId).orFail();

        if (!utils.isValidEmail(email)) {
            return res.status(400).json({ error: "Invalid email!" });
        }

        user.email = email;
        await user.save();

        await LogService.generate(
            req.session.mongoId!,
            `Updated email for [**${user.username}**](https://osu.ppy.sh/users/${user.osuId}) to ${email}`,
            "user"
        );

        res.json({
            message: `Updated email successfully!`,
            user,
        });
    }

    /** GET review stats */
    public async getReviewStats(req: Request, res: Response) {
        const { userId } = req.params;
        const user = await User.findById(userId).orFail();

        // Get the date 90 days ago
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        // Find all tournaments where user is assigned as a reviewer
        const tournaments = await Tournament.find({
            assignedReviewers: user._id,
        }).populate([
            {
                path: "reviews",
                select: "author",
                populate: {
                    path: "author",
                    select: "_id username",
                },
            },
        ]);

        // Calculate statistics
        const stats = {
            activeReviews: 0,
            totalAssignedLast90Days: 0,
            totalSubmittedLast90Days: 0,
        };

        for (const tournament of tournaments) {
            // Skip if no startedReviewAt date
            if (!tournament.startedReviewAt) continue;

            const startedReviewDate = new Date(tournament.startedReviewAt);
            const hasUserSubmittedReview = tournament.reviews?.some(
                (review) => review.author?._id.toString() === user._id.toString()
            );

            // Count active reviews
            if (tournament.isActive) {
                stats.activeReviews++;
            }

            // Count reviews in last 90 days
            if (startedReviewDate >= ninetyDaysAgo) {
                stats.totalAssignedLast90Days++;
                if (hasUserSubmittedReview) {
                    stats.totalSubmittedLast90Days++;
                }
            }
        }

        res.json(stats);
    }

    /** PATCH cycle bag */
    public async cycleBag(req: Request, res: Response) {
        const reviewers = await UserService.assignReviewers("tc");

        res.json({
            message: "Assignments cycled successfully!",
            reviewers,
        });

        await LogService.generate(
            req.session.mongoId!,
            `Cycled tournament reviewers and got: ${reviewers
                .map((u) => `[**${u.username}**](${u.osuProfileUrl})`)
                .join(", ")}`,
            "user"
        );
    }

    /** GET watchlist */
    public async getWatchlist(req: Request, res: Response) {
        const reqQuery = req.query as WatchlistQuery;
        const query: any = { infringements: { $exists: true, $ne: [] } };

        if (reqQuery.userInput) {
            const userInput = utils.escapeUsername(reqQuery.userInput);
            if (utils.isNumeric(userInput)) {
                query.osuId = parseInt(userInput, 10);
            } else {
                query.username = { $regex: userInput, $options: "i" };
            }
        }

        if (reqQuery.infringementType) {
            query["infringements.type"] = reqQuery.infringementType;
        }

        const users = await User.find(query);
        res.json(users);
    }

    /** POST add infringement */
    public async addInfringement(req: Request, res: Response) {
        const { userId } = req.params;
        const { type, duration, reason, threadId } = req.body;

        console.log(type, duration, reason, threadId);

        if (!Object.values(InfringementType).includes(type)) {
            return res.status(400).json({ error: "Invalid infringement type" });
        }

        const isNotPunishment =
            type === InfringementType.NOTE || type === InfringementType.WARNING || type === InfringementType.PROBATION;

        // duration should be either -1, more than 0, or 0 AND the type is note or warning
        if (duration < 1 && duration !== -1 && duration === 0 && !isNotPunishment) {
            return res.status(400).json({ error: "Invalid duration" });
        }

        if (!reason || typeof reason !== "string" || reason?.trim() === "") {
            return res.status(400).json({ error: "Reason is required and must be a non-empty string" });
        }

        if ((threadId && typeof threadId !== "string") || threadId?.trim() === "") {
            return res.status(400).json({ error: "Thread ID must be a non-empty string" });
        }

        const user = await User.findById(userId).orFail();

        user.infringements.push({ type, duration, reason, threadId });
        await user.save();

        res.json({ message: "Infringement added successfully!" });
    }
}

export default new UsersController();
