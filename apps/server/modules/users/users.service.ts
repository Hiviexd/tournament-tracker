import {
    BadGatewayException,
    BadRequestException,
    HttpException,
    HttpStatus,
    Inject,
    Injectable,
    NotFoundException,
} from "@nestjs/common";
import type { Session } from "express-session";
import type { Model } from "mongoose";
import type { ITicket } from "@tc/types/Ticket";
import type { IUser, IUserStatics, UserListQuery } from "@tc/types/User";
import utils from "@tc/utils/server";
import UserService from "@tc/osu/UserService";
import { EmbedBuilder } from "@tc/notifications/discord/EmbedBuilder";
import { WebhookBuilder } from "@tc/notifications/discord/WebhookBuilder";
import DiscordUtils from "@tc/notifications/discord/DiscordUtils";
import OsuApiService from "@tc/osu/OsuApiService";
import LogService from "@tc/models/LogService";
import Voting from "@tc/models/votingModel";
import TournamentService from "../../services/TournamentService";
import { TICKET_MODEL, USER_MODEL } from "../common/database.tokens";

@Injectable()
export class UsersService {
    constructor(
        @Inject(USER_MODEL) private readonly userModel: IUserStatics,
        @Inject(TICKET_MODEL) private readonly ticketModel: Model<ITicket>,
    ) {}

    getSelf(currentUser: IUser) {
        return UserService.sanitizeUser(currentUser, currentUser);
    }

    async index(reqQuery: UserListQuery, currentUser: IUser | undefined) {
        let userInput = reqQuery.userInput;

        if (userInput && utils.validateOsuProfileLink(userInput)) {
            userInput = utils.validateOsuProfileLink(userInput)!;
        }

        if (!userInput) {
            // Preserve Express contract: 400 with empty array body
            throw new HttpException([], HttpStatus.BAD_REQUEST);
        }

        userInput = utils.escapeUsername(userInput);

        const populateInfringements = !!currentUser?.isCommitteeOrAdmin;

        let users: IUser[] = [];

        if (utils.isValidMongoId(userInput)) {
            const query = this.userModel.findById(userInput);
            const user = populateInfringements ? await query.populate("infringements") : await query;
            if (user) users.push(user);
        } else if (utils.isNumeric(userInput)) {
            const query = this.userModel.findOne({ osuId: parseInt(userInput, 10) });
            const user = populateInfringements ? await query.populate("infringements") : await query;
            if (user) users.push(user);
        } else {
            const query = this.userModel.find({ username: { $regex: userInput, $options: "i" } });
            users = populateInfringements ? await query.populate("infringements") : await query;
        }

        const sanitizedUsers = users.map((user) => UserService.sanitizeUser(user, currentUser));

        return reqQuery.limit ? sanitizedUsers.slice(0, parseInt(reqQuery.limit, 10)) : sanitizedUsers;
    }

    async getUser(userInput: string, currentUser: IUser | undefined) {
        const user = await this.userModel.findByUsernameOrOsuId(userInput);

        if (!user) {
            throw new NotFoundException("User not found");
        }

        const userWithInfringements = await this.userModel.findById(user._id).populate("infringements");
        return UserService.sanitizeUser(userWithInfringements!, currentUser);
    }

    async getOsuUserInfo(accessToken: string, userInput: string) {
        const user = await OsuApiService.getUserInfo(accessToken, userInput);

        if (OsuApiService.isOsuResponseError(user)) {
            throw new NotFoundException("osu! user not found!");
        }

        return user;
    }

    async getCommittee(type: string | undefined, includeAlumni: boolean, currentUser: IUser | undefined) {
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

        const committee = await this.userModel.find(query).orFail();

        return committee.map((user) => UserService.sanitizeUser(user, currentUser));
    }

    async create(accessToken: string, userInput: string | undefined, session: Session) {
        if (userInput == null || userInput === "") {
            throw new NotFoundException("User not found");
        }

        const user = await UserService.findOrCreateUser(accessToken, userInput);

        if (!user) {
            throw new NotFoundException("User not found");
        }

        await new WebhookBuilder()
            .addEmbed(
                new EmbedBuilder()
                    .setAuthor(DiscordUtils.defaultWebhookAuthor(session))
                    .setColor(DiscordUtils.webhookColors.blue)
                    .setDescription(
                        `Added new user **[${user.username}](https://osu.ppy.sh/users/${user.osuId})** to the database`,
                    ),
            )
            .setLocation("dev")
            .send();

        return { message: "User created successfully!", user };
    }

    async toggleReviewerStatus(userId: string, session: Session) {
        const user = await this.userModel.findById(userId).orFail();

        user.isActiveReviewer = !user.isActiveReviewer;
        await user.save();

        await LogService.generate(
            session.mongoId!,
            `Toggled activity status for [**${user.username}**](https://osu.ppy.sh/users/${user.osuId}) to **${user.isActiveReviewer}**`,
            "user",
        );

        await new WebhookBuilder()
            .addEmbed(
                new EmbedBuilder()
                    .setAuthor(DiscordUtils.defaultWebhookAuthor(session))
                    .setColor(DiscordUtils.webhookColors.orange)
                    .setDescription(
                        `Marked [**${user.username}**](https://osu.ppy.sh/users/${user.osuId}) as **${
                            user.isActiveReviewer ? "active" : "inactive"
                        }** reviewer`,
                    ),
            )
            .send();

        return {
            message: `Set activity status as ${user.isActiveReviewer ? "active" : "inactive"}!`,
            user,
        };
    }

    async toggleVoterStatus(userId: string, session: Session) {
        const user = await this.userModel.findById(userId).orFail();

        user.isActiveVoter = !user.isActiveVoter;
        await user.save();

        await LogService.generate(
            session.mongoId!,
            `Toggled voting activity status for [**${user.username}**](https://osu.ppy.sh/users/${user.osuId}) to **${user.isActiveVoter}**`,
            "user",
        );

        await new WebhookBuilder()
            .addEmbed(
                new EmbedBuilder()
                    .setAuthor(DiscordUtils.defaultWebhookAuthor(session))
                    .setColor(DiscordUtils.webhookColors.lightOrange)
                    .setDescription(
                        `Marked [**${user.username}**](https://osu.ppy.sh/users/${user.osuId}) as **${
                            user.isActiveVoter ? "active" : "inactive"
                        }** voter`,
                    ),
            )
            .send();

        return {
            message: `Set voting activity status as ${user.isActiveVoter ? "active" : "inactive"}!`,
            user,
        };
    }

    async updateUserGroups(userId: string, group: string, join: boolean, session: Session) {
        if (!["tc", "cc"].includes(group)) {
            throw new BadRequestException("Invalid group");
        }

        const user = await this.userModel.findById(userId).orFail();

        if (join) {
            if (!user.groups.includes(group as any)) {
                user.groups.push(group as any);
            }

            user.groups = user.groups.filter((g) => g !== "alm");
        } else {
            user.groups = user.groups.filter((g) => g !== group);

            if (!user.groups.some((g) => ["tc", "cc"].includes(g)) && !user.groups.includes("alm")) {
                user.groups.push("alm");
            }
        }

        await user.save();

        const historyEntry = {
            date: new Date(),
            group,
            kind: (join ? "join" : "leave") as "join" | "leave",
        };

        user.history.push(historyEntry as any);
        await user.save();

        const groupName = group === "tc" ? "Tournament Committee" : "Contest Committee";

        await LogService.generate(
            session.mongoId!,
            `${join ? "Added" : "Removed"} [**${user.username}**](https://osu.ppy.sh/users/${user.osuId}) ${
                join ? "to" : "from"
            } the **${groupName}**`,
            "user",
        );

        await new WebhookBuilder()
            .addEmbed(
                new EmbedBuilder()
                    .setAuthor(DiscordUtils.defaultWebhookAuthor(session))
                    .setColor(join ? DiscordUtils.webhookColors.lightGreen : DiscordUtils.webhookColors.lightRed)
                    .setDescription(
                        `${join ? "Added" : "Removed"} [**${user.username}**](https://osu.ppy.sh/users/${user.osuId}) ${
                            join ? "to" : "from"
                        } the **${groupName}**`,
                    ),
            )
            .send();

        return {
            message: `User ${join ? "added to" : "removed from"} the **${groupName}** successfully!`,
            user,
        };
    }

    async updateBadge(userId: string, increment: boolean, session: Session) {
        const user = await this.userModel.findById(userId).orFail();
        const oldValue = user.badgeValue;

        if (increment && user.badgeValue < 10) {
            user.badgeValue++;
        } else if (!increment && user.badgeValue > 0) {
            user.badgeValue--;
        } else {
            throw new BadRequestException(
                increment ? "Badge value cannot exceed 10!" : "Badge value cannot be less than 0!",
            );
        }

        await user.save();

        await LogService.generate(
            session.mongoId!,
            `Changed [**${user.username}**](https://osu.ppy.sh/users/${user.osuId})'s badge level from **${oldValue}** to **${user.badgeValue}**`,
            "user",
        );

        await new WebhookBuilder()
            .addEmbed(
                new EmbedBuilder()
                    .setAuthor(DiscordUtils.defaultWebhookAuthor(session))
                    .setColor(DiscordUtils.webhookColors.orange)
                    .setDescription(
                        `Changed [**${user.username}**](https://osu.ppy.sh/users/${user.osuId})'s badge level from **${oldValue}** to **${user.badgeValue}**`,
                    ),
            )
            .send();

        return {
            message: `Badge level updated to ${user.badgeValue}`,
            user,
        };
    }

    async syncUser(userId: string, accessToken: string) {
        const user = await this.userModel.findById(userId).orFail();

        const userResponse = await OsuApiService.getUserInfo(accessToken, user.osuId);

        if (OsuApiService.isOsuResponseError(userResponse)) {
            throw new BadGatewayException("Failed to fetch user data from osu!");
        }

        const updatedUser = await UserService.createOrUpdateUser(userResponse, user);

        return {
            message: "User data synced successfully!",
            user: updatedUser,
        };
    }

    async updateDiscordId(userId: string, discordId: string, session: Session) {
        const user = await this.userModel.findById(userId).orFail();

        if (Number.isNaN(Number(discordId))) {
            throw new BadRequestException("Invalid Discord ID!");
        }

        user.discordId = discordId;
        await user.save();

        await LogService.generate(
            session.mongoId!,
            `Updated Discord ID for [**${user.username}**](https://osu.ppy.sh/users/${user.osuId}) to ${discordId}`,
            "user",
        );

        return {
            message: `Updated Discord ID successfully!`,
            user,
        };
    }

    async updateEmail(userId: string, email: string, session: Session) {
        const user = await this.userModel.findById(userId).orFail();

        if (!utils.isValidEmail(email)) {
            throw new BadRequestException("Invalid email!");
        }

        user.email = email;
        await user.save();

        await LogService.generate(
            session.mongoId!,
            `Updated email for [**${user.username}**](https://osu.ppy.sh/users/${user.osuId}) to ${email}`,
            "user",
        );

        return {
            message: `Updated email successfully!`,
            user,
        };
    }

    async getReviewStats(userId: string, daysQuery: string | number | undefined) {
        const rawDays = daysQuery != null ? Number(daysQuery) : 180;
        const days = Math.min(365, Math.max(1, Math.floor(rawDays)));
        const user = await this.userModel.findById(userId).orFail();

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

        return {
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
        };
    }

    async cycleBag(session: Session) {
        const reviewers = await UserService.assignReviewers("tc");

        await LogService.generate(
            session.mongoId!,
            `Cycled tournament reviewers and got: ${reviewers
                .map((u) => `[**${u.username}**](${u.osuProfileUrl})`)
                .join(", ")}`,
            "user",
        );

        return {
            message: "Assignments cycled successfully!",
            reviewers,
        };
    }

    async getRelatedReportsAndVotings(userId: string) {
        const user = await this.userModel.findByUsernameOrOsuId(userId);

        if (!user) {
            throw new NotFoundException("User not found");
        }

        const [reports, votings] = await Promise.all([
            this.ticketModel.find({ type: "report", targetUser: user._id }).populate([
                { path: "author", select: "username osuId groups coverUrl country" },
            ]),
            Voting.find({ category: "user", targetUser: user._id }).populate([
                { path: "author", select: "username osuId groups coverUrl country" },
            ]),
        ]);

        return { reports, votings };
    }
}
