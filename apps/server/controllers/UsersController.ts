import { IUser, UserGroup, UserListQuery } from "@tc/types/User";
import User from "../models/userModel";
import utils from "@tc/utils/server";
import UserService from "../services/UserService";
import VotingService from "../services/VotingService";
import { EmbedBuilder } from "../services/discord/EmbedBuilder";
import { WebhookBuilder } from "../services/discord/WebhookBuilder";
import DiscordUtils from "../services/discord/DiscordUtils";
import OsuApiService from "../services/OsuApiService";
import LogService from "../services/LogService";
import config from "@tc/config";
import { Request, Response } from "express";
import TournamentService from "../services/TournamentService";
import Ticket from "../models/ticketModel";
import Voting from "../models/votingModel";

class UsersController {
    /** GET logged in user */
    public getSelf(_: Request, res: Response) {
        const user = res.locals!.user!;
        res.json(UserService.sanitizeUser(user, user));
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

        const populateInfringements = !!currentUser?.isCommitteeOrAdmin;

        let users: IUser[] = [];

        if (utils.isValidMongoId(userInput)) {
            const query = User.findById(userInput);
            const user = populateInfringements ? await query.populate("infringements") : await query;
            if (user) users.push(user);
        } else if (utils.isNumeric(userInput)) {
            const query = User.findOne({ osuId: parseInt(userInput, 10) });
            const user = populateInfringements ? await query.populate("infringements") : await query;
            if (user) users.push(user);
        } else {
            const query = User.find({ username: { $regex: userInput, $options: "i" } });
            users = populateInfringements ? await query.populate("infringements") : await query;
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

        const userWithInfringements = await User.findById(user._id).populate("infringements");
        const sanitizedUser = UserService.sanitizeUser(userWithInfringements!, currentUser);

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

        await new WebhookBuilder()
            .addEmbed(
                new EmbedBuilder()
                    .setAuthor(DiscordUtils.defaultWebhookAuthor(req.session))
                    .setColor(DiscordUtils.webhookColors.blue)
                    .setDescription(
                        `Added new user **[${user.username}](https://osu.ppy.sh/users/${user.osuId})** to the database`,
                    ),
            )
            .setLocation("dev")
            .send();

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
            "user",
        );

        await new WebhookBuilder()
            .addEmbed(
                new EmbedBuilder()
                    .setAuthor(DiscordUtils.defaultWebhookAuthor(req.session))
                    .setColor(DiscordUtils.webhookColors.orange)
                    .setDescription(
                        `Marked [**${user.username}**](https://osu.ppy.sh/users/${user.osuId}) as **${
                            user.isActiveReviewer ? "active" : "inactive"
                        }** reviewer`,
                    ),
            )
            .send();

        res.json({
            message: `Set activity status as ${user.isActiveReviewer ? "active" : "inactive"}!`,
            user,
        });
    }

    /** POST toggle isActiveVoter */
    public async toggleVoterStatus(req: Request, res: Response): Promise<void> {
        const { userId } = req.params;

        const user = await User.findById(userId).orFail();

        user.isActiveVoter = !user.isActiveVoter;
        await user.save();

        await LogService.generate(
            req.session.mongoId!,
            `Toggled voting activity status for [**${user.username}**](https://osu.ppy.sh/users/${user.osuId}) to **${user.isActiveVoter}**`,
            "user",
        );

        const webhook = new WebhookBuilder().addEmbed(
            new EmbedBuilder()
                .setAuthor(DiscordUtils.defaultWebhookAuthor(req.session))
                .setColor(DiscordUtils.webhookColors.lightOrange)
                .setDescription(
                    `Marked [**${user.username}**](https://osu.ppy.sh/users/${user.osuId}) as **${
                        user.isActiveVoter ? "active" : "inactive"
                    }** voter`,
                ),
        );

        await appendRequiredVotesRecalibration(webhook, user.groups, req.session.mongoId!);
        await webhook.send();

        res.json({
            message: `Set voting activity status as ${user.isActiveVoter ? "active" : "inactive"}!`,
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
            "user",
        );

        const webhook = new WebhookBuilder().addEmbed(
            new EmbedBuilder()
                .setAuthor(DiscordUtils.defaultWebhookAuthor(req.session))
                .setColor(join ? DiscordUtils.webhookColors.lightGreen : DiscordUtils.webhookColors.lightRed)
                .setDescription(
                    `${join ? "Added" : "Removed"} [**${user.username}**](https://osu.ppy.sh/users/${user.osuId}) ${
                        join ? "to" : "from"
                    } the **${groupName}**`,
                ),
        );

        // Include `group` even on leave so votes assigned to that group still recalibrate
        await appendRequiredVotesRecalibration(webhook, [group], req.session.mongoId!);
        await webhook.send();

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
                error: increment ? "Badge value cannot exceed 10!" : "Badge value cannot be less than 0!",
            });
        }

        await user.save();

        // Log the change
        await LogService.generate(
            req.session.mongoId!,
            `Changed [**${user.username}**](https://osu.ppy.sh/users/${user.osuId})'s badge level from **${oldValue}** to **${user.badgeValue}**`,
            "user",
        );

        // Discord webhook notification
        await new WebhookBuilder()
            .addEmbed(
                new EmbedBuilder()
                    .setAuthor(DiscordUtils.defaultWebhookAuthor(req.session))
                    .setColor(DiscordUtils.webhookColors.orange)
                    .setDescription(
                        `Changed [**${user.username}**](https://osu.ppy.sh/users/${user.osuId})'s badge level from **${oldValue}** to **${user.badgeValue}**`,
                    ),
            )
            .send();

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
            "user",
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
            "user",
        );

        res.json({
            message: `Updated email successfully!`,
            user,
        });
    }

    /** GET review stats */
    public async getReviewStats(req: Request, res: Response) {
        const { userId } = req.params;
        const rawDays = req.query.days != null ? Number(req.query.days) : 180;
        const days = Math.min(365, Math.max(1, Math.floor(rawDays)));
        const user = await User.findById(userId).orFail();

        const { assignments } = await TournamentService.findAssignedTournamentsForUser(user, days);

        const addAssignments = assignments.filter((a) => a.actionIcon === "add");
        const tournamentIdsAssigned = new Set(addAssignments.map((a) => a.tournament.id));
        const addWithReview = addAssignments.filter((a) => a.dateReviewed != null);
        const tournamentIdsWithReview = new Set(addWithReview.map((a) => a.tournament.id));
        const activeTournamentIds = new Set(
            addAssignments.filter((a) => a.tournament.isActive).map((a) => a.tournament.id),
        );

        const activeReviews = activeTournamentIds.size;
        const totalAssignedLastNDays = tournamentIdsAssigned.size;
        const totalSubmittedLastNDays = tournamentIdsWithReview.size;

        res.json({
            activeReviews,
            totalAssignedLastNDays,
            totalSubmittedLastNDays,
            assignments: assignments.map((a) => ({
                tournament: a.tournament,
                dateAssigned: a.dateAssigned,
                dateReviewed: a.dateReviewed,
                timespan: a.timespan,
                actionIcon: a.actionIcon,
            })),
        });
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
            "user",
        );
    }

    /** GET related reports and votings */
    public async getRelatedReportsAndVotings(req: Request, res: Response) {
        const { userId } = req.params;
        const user = await User.findByUsernameOrOsuId(userId);

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const [reports, votings] = await Promise.all([
            Ticket.find({ type: "report", targetUser: user._id }).populate([
                { path: "author", select: "username osuId groups coverUrl country" },
            ]),
            Voting.find({ category: "user", targetUser: user._id }).populate([
                { path: "author", select: "username osuId groups coverUrl country" },
            ]),
        ]);

        res.json({ reports, votings });
    }
}

async function appendRequiredVotesRecalibration(
    webhook: WebhookBuilder,
    groups: UserGroup[],
    actorId: string,
): Promise<void> {
    const changed = await VotingService.recalibrateActiveVotingsForGroups(groups);
    if (!changed.length) return;

    webhook.addEmbed(VotingService.buildRecalibrationEmbed(changed));

    await LogService.generate(
        actorId,
        `Recalibrated required votes for: ${changed
            .map(
                ({ voting, result }) =>
                    `[**${voting.title}**](${config.baseUrl}/votes/${voting._id}) (${result.previous} → ${result.next})`,
            )
            .join(", ")}`,
        "voting",
    );
}

export default new UsersController();
