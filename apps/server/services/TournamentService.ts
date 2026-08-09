import { Injectable } from "@nestjs/common";
import {
    ITournament,
    GameMode,
    TournamentType,
    TournamentStatus,
    ITournamentReviewHistoryEntry,
    ITournamentExtraLink,
} from "@tc/types/Tournament";
import { IUser } from "@tc/types/User";
import { FlattenMaps } from "mongoose";
import { IReview } from "@tc/types/Review";
import { ITicket } from "@tc/types/Ticket";
import { IVoting } from "@tc/types/Voting";
import Ticket from "@tc/models/ticketModel";
import Voting from "@tc/models/votingModel";
import utils from "@tc/utils/server";
import UserService from "@tc/osu/UserService";
import Tournament from "@tc/models/tournamentModel";
import User from "@tc/models/userModel";
import LogService from "@tc/models/LogService";
import NotificationDispatchService from "@tc/notifications/NotificationDispatchService";
import { WebhookBuilder } from "@tc/notifications/discord/WebhookBuilder";
import { EmbedBuilder } from "@tc/notifications/discord/EmbedBuilder";
import DiscordUtils from "@tc/notifications/discord/DiscordUtils";
import config from "@tc/config";
import capitalize from "lodash/capitalize.js";
import startCase from "lodash/startCase.js";
import dayjs from "@tc/utils/dayjs";

@Injectable()
export class TournamentService {
    /**
     * Add a log to a tournament
     * @param tournament - The tournament to add the log to
     * @param user - The user who performed the action
     * @param action - The action to add to the log
     */
    public async addTournamentLog(tournament: any, user: IUser, action: string, icon: string = "history") {
        tournament.logs.push({
            user,
            action,
            icon,
            createdAt: new Date(),
        });

        await tournament.save();
    }

    /**
     * Sanitizes tournament listing data based on user permissions
     * Removes sensitive fields from non-committee users
     */
    public sanitizeTournamentListing(
        tournament: FlattenMaps<ITournament>,
        actor: IUser | undefined,
    ): FlattenMaps<ITournament> {
        if (!actor || !actor.isCommitteeOrAdmin) {
            const sanitized = { ...tournament };
            sanitized.reviews = [];
            sanitized.assignedReviewers = [];
            sanitized.threadId = undefined;
            sanitized.enchantUrl = undefined;
            sanitized.notes = [];
            sanitized.logs = [];
            sanitized.reviewHistory = [];

            // sanitize hosts and winners with UserService
            sanitized.hosts = sanitized.hosts?.map((host) => UserService.sanitizeUser(host, actor));
            sanitized.winners = sanitized.winners?.map((winner) => UserService.sanitizeUser(winner, actor));

            return sanitized;
        }

        return tournament;
    }

    /**
     * Censor data from a given tournament
     * This is different from the one above because we have special handling for reviews
     * maybe we can just use this one after all?
     */
    public censorTournamentData<T extends ITournament>(tournament: T, user: IUser | undefined) {
        if (!user || !user.isCommitteeOrAdmin) {
            // outright clear the reviews array if the user is not a tournament host, or if the status is not changesRequested
            const isHost = user && tournament.hosts && tournament.hosts.some((host) => host._id.equals(user._id));

            if (!user || !isHost || tournament.status !== "changesRequested") {
                tournament.reviews = [];
            } else {
                // Censor reviews
                if (tournament.reviews) {
                    tournament.reviews.forEach((review: IReview) => {
                        review.author = undefined;
                        review.comment = "";
                        review.vote = "changesRequested";
                    });
                }
            }
            tournament.hosts = tournament.hosts?.map((host) => UserService.sanitizeUser(host, user));
            tournament.winners = tournament.winners?.map((winner) => UserService.sanitizeUser(winner, user));
            tournament.assignedReviewers = [];
            tournament.threadId = undefined;
            tournament.enchantUrl = undefined;
            tournament.notes = [];
            tournament.logs = [];
            tournament.reviewHistory = [];
        }

        return tournament;
    }

    /**
     * Gets all reports related to a tournament by forum ID and tournament name
     * @param tournament The tournament to find related reports for
     * @returns Array of tickets that are reports related to this tournament
     */
    public async getRelatedReports(tournament: ITournament): Promise<ITicket[]> {
        const searchCriteria: any[] = [];

        // Search by forum ID if available
        if (tournament.forumUrl) {
            const forumId = utils.extractOsuForumId(tournament.forumUrl);
            if (forumId) {
                searchCriteria.push({
                    targetTournamentLink: { $regex: `/topics/${forumId}` },
                });
            }
        }

        // Search by tournament name
        if (tournament.name) {
            searchCriteria.push({
                targetTournamentName: { $regex: tournament.name, $options: "i" },
            });
        }

        if (searchCriteria.length === 0) {
            return [];
        }

        const reports = await Ticket.find({
            type: "report",
            $or: searchCriteria,
        }).populate([
            {
                path: "author",
                select: "username osuId groups coverUrl country",
            },
        ]);

        return reports;
    }

    /**
     * Find tournaments where the user was assigned or removed as reviewer within the last `days` days,
     * and build assignment rows for the review stats table (date assigned/removed, date reviewed, timespan, action icon).
     * Includes both assign/initial and remove events so removals are visible.
     */
    public async findAssignedTournamentsForUser(
        user: IUser,
        days: number,
    ): Promise<{
        assignments: Array<{
            tournament: { id: string; name: string; isActive: boolean };
            dateAssigned: Date;
            dateReviewed: Date | null;
            timespan: string | null;
            actionIcon: "add" | "remove";
        }>;
    }> {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);

        const tournaments = await Tournament.find({
            reviewHistory: {
                $elemMatch: {
                    user: user._id,
                    action: { $in: ["assign", "initial", "remove"] },
                    createdAt: { $gte: cutoff },
                },
            },
        })
            .populate([
                {
                    path: "reviews",
                    select: "author createdAt",
                    populate: { path: "author", select: "_id" },
                },
            ])
            .lean();

        const assignments: Array<{
            tournament: { id: string; name: string; isActive: boolean };
            dateAssigned: Date;
            dateReviewed: Date | null;
            timespan: string | null;
            actionIcon: "add" | "remove";
        }> = [];

        const userIdStr = user._id.toString();

        for (const tournament of tournaments) {
            const reviewHistory = tournament.reviewHistory || [];
            const assignOrInitialEntries = reviewHistory.filter(
                (entry: ITournamentReviewHistoryEntry) =>
                    entry.user.toString() === userIdStr &&
                    (entry.action === "assign" || entry.action === "initial") &&
                    new Date(entry.createdAt) >= cutoff,
            );
            const removeEntries = reviewHistory.filter(
                (entry: ITournamentReviewHistoryEntry) =>
                    entry.user.toString() === userIdStr &&
                    entry.action === "remove" &&
                    new Date(entry.createdAt) >= cutoff,
            );

            const userReview = tournament.reviews?.find(
                (r: IReview) => r.author && r.author._id.toString() === userIdStr,
            );
            const dateReviewed = userReview?.createdAt ? new Date(userReview.createdAt) : null;

            for (const entry of assignOrInitialEntries) {
                const dateAssigned = new Date(entry.createdAt);

                let timespan: string | null = null;
                if (dateReviewed) {
                    const diffMs = dateReviewed.getTime() - dateAssigned.getTime();
                    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                    timespan = diffDays === 0 ? "Same day" : `${diffDays} day${diffDays !== 1 ? "s" : ""}`;
                }

                assignments.push({
                    tournament: {
                        id: tournament._id.toString(),
                        name: tournament.name,
                        isActive: tournament.isActive ?? true,
                    },
                    dateAssigned,
                    dateReviewed,
                    timespan,
                    actionIcon: "add",
                });
            }

            for (const entry of removeEntries) {
                assignments.push({
                    tournament: {
                        id: tournament._id.toString(),
                        name: tournament.name,
                        isActive: tournament.isActive ?? true,
                    },
                    dateAssigned: new Date(entry.createdAt),
                    dateReviewed: null,
                    timespan: null,
                    actionIcon: "remove",
                });
            }
        }

        // Sort by dateAssigned descending (most recent first)
        assignments.sort((a, b) => b.dateAssigned.getTime() - a.dateAssigned.getTime());

        return { assignments };
    }

    /**
     * Gets all votings related to a tournament by forum ID, tournament name, and voting title
     * @param tournament The tournament to find related votings for
     * @returns Array of votings related to this tournament
     */
    public async getRelatedVotings(tournament: ITournament): Promise<IVoting[]> {
        const searchCriteria: any[] = [];

        // Search by forum ID if available
        if (tournament.forumUrl) {
            const forumId = utils.extractOsuForumId(tournament.forumUrl);
            if (forumId) {
                searchCriteria.push({
                    targetTournamentLink: { $regex: `/topics/${forumId}` },
                });
            }
        }

        // Search by tournament name in voting title and targetTournamentName
        if (tournament.name) {
            searchCriteria.push(
                {
                    title: { $regex: tournament.name, $options: "i" },
                },
                {
                    targetTournamentName: { $regex: tournament.name, $options: "i" },
                },
            );
        }

        if (searchCriteria.length === 0) {
            return [];
        }

        const votings = await Voting.find({
            $or: searchCriteria,
        }).populate([
            {
                path: "author",
                select: "username osuId groups coverUrl country",
            },
        ]);

        return votings;
    }

    /**
     * Creates a search query for tournaments based on search string
     * @param search The search string to process
     * @returns MongoDB query object for tournament search
     */
    public createSearchQuery(search: string): any {
        if (!search) {
            return {};
        }

        // search by forum url if the search is either a number or a valid osu! forum URL
        const forumId = utils.isNumeric(search) ? parseInt(search) : utils.extractOsuForumId(search);

        if (forumId) {
            return { $and: [{ forumUrl: { $regex: forumId.toString() } }] };
        }

        // fallback to searching by name and tags
        const searchTerms = utils.splitSearchTerms(search);

        if (searchTerms.length === 0) {
            return {};
        }

        return {
            $and: searchTerms.map((term) => {
                const termRegex = new RegExp(utils.escapeRegexPattern(term), "i");
                return {
                    $or: [{ name: termRegex }, { tags: { $in: [termRegex] } }],
                };
            }),
        };
    }

    /**
     * Update tournament name
     */
    public async updateName(tournament: ITournament, name: string, currentUser: IUser): Promise<{ error?: string }> {
        if (!name) {
            return { error: "Name is required" };
        }
        if (!utils.isLatinScriptOnly(name)) {
            return { error: "Name must be in Latin script (no Cyrillic, Chinese, etc.)" };
        }

        const oldName = tournament.name;
        tournament.name = name;

        await this.addTournamentLog(
            tournament,
            currentUser,
            `Updated name from **${oldName}** to **${name}**`,
            "pen-to-square",
        );
        await LogService.generate(currentUser.id, `Updated name for **${tournament.name}**`, "tournament");

        return {};
    }

    /**
     * Update tournament hosts
     */
    public async updateHosts(
        tournament: ITournament,
        hostIds: string[],
        currentUser: IUser,
    ): Promise<{ error?: string }> {
        if (!Array.isArray(hostIds) || hostIds.length === 0) {
            return { error: "At least one host is required" };
        }

        const hostsUnordered = await User.find({ _id: { $in: hostIds } }).populate("infringements");

        if (hostsUnordered.length !== hostIds.length) {
            return { error: "One or more host IDs are invalid" };
        }

        // Preserve the order of hosts based on hostIds
        const hosts = hostIds
            .map((id) => hostsUnordered.find((host) => host._id.toString() === id))
            .filter((host) => host !== undefined) as typeof hostsUnordered;

        // Check for active infringements on any host
        const hostsWithInfringements = hosts.filter((host) => host.activeInfringement);
        if (hostsWithInfringements.length > 0) {
            const hostnames = hostsWithInfringements.map((host) => host.username).join(", ");
            return { error: `Cannot set hosts that have active infringements: ${hostnames}` };
        }

        tournament.hosts = hosts;

        // Re-fetch to get populated hosts for logging
        const updatedTournament = await Tournament.findById(tournament._id).populate("hosts").orFail();

        await this.addTournamentLog(
            tournament,
            currentUser,
            `Updated hosts: ${utils.formatHostsList(updatedTournament.hosts, { mdLinks: true })}`,
            "users",
        );
        await LogService.generate(currentUser.id, `Updated hosts for **${tournament.name}**`, "tournament");

        return {};
    }

    /**
     * Update tournament game modes (admin only)
     */
    public async updateModes(
        tournament: ITournament,
        modes: GameMode[],
        currentUser: IUser,
    ): Promise<{ error?: string }> {
        if (!currentUser.isAdmin) {
            return { error: "Only admins can change game modes" };
        }
        if (!Array.isArray(modes) || modes.length === 0) {
            return { error: "At least one game mode is required" };
        }

        tournament.modes = modes;

        await this.addTournamentLog(
            tournament,
            currentUser,
            `Updated game modes: ${modes.map((mode) => utils.formatGameMode(mode)).join(", ")}`,
            "gamepad",
        );
        await LogService.generate(currentUser.id, `Updated game modes for **${tournament.name}**`, "tournament");

        return {};
    }

    /**
     * Update tournament type (admin only)
     */
    public async updateType(
        tournament: ITournament,
        type: TournamentType,
        currentUser: IUser,
    ): Promise<{ error?: string }> {
        if (!currentUser.isAdmin) {
            return { error: "Only admins can change tournament type" };
        }
        if (!["tournament", "contest"].includes(type)) {
            return { error: "Invalid tournament type" };
        }

        const oldType = tournament.type;
        tournament.type = type;

        await this.addTournamentLog(
            tournament,
            currentUser,
            `Updated type from **${startCase(oldType)}** to **${startCase(type)}**`,
            "pen-to-square",
        );
        await LogService.generate(currentUser.id, `Updated type for **${tournament.name}**`, "tournament");

        return {};
    }

    /**
     * Update forum URL
     */
    public async updateForumUrl(
        tournament: ITournament,
        forumUrl: string,
        currentUser: IUser,
    ): Promise<{ error?: string }> {
        if (forumUrl && !utils.isOsuForumLink(forumUrl)) {
            return { error: "Invalid osu! forum URL" };
        }

        // remove query parameters from forum url
        const cleanForumUrl = forumUrl ? forumUrl.split("?")[0] : "";

        tournament.forumUrl = cleanForumUrl;

        const logMessage = cleanForumUrl ? `Updated forum URL: **${cleanForumUrl}**` : "Cleared forum URL";
        await this.addTournamentLog(tournament, currentUser, logMessage, "link");
        await LogService.generate(currentUser.id, `Updated forum URL for **${tournament.name}**`, "tournament");

        return {};
    }

    /**
     * Update extra links
     */
    public async updateExtraLinks(
        tournament: ITournament,
        extraLinks: ITournamentExtraLink[],
        currentUser: IUser,
    ): Promise<{ error?: string }> {
        const validationError = utils.validateExtraLinks(extraLinks);
        if (validationError) return { error: validationError };

        tournament.extraLinks = extraLinks.map((link) => ({
            type: link.type,
            name: link.name.trim(),
            url: link.url.trim(),
        }));

        await this.addTournamentLog(
            tournament,
            currentUser,
            `Updated extra links (${tournament.extraLinks.length})`,
            "link",
        );
        await LogService.generate(currentUser.id, `Updated extra links for **${tournament.name}**`, "tournament");

        return {};
    }

    /**
     * Update Enchant URL
     */
    public async updateEnchantUrl(
        tournament: ITournament,
        enchantUrl: string,
        currentUser: IUser,
    ): Promise<{ error?: string }> {
        if (enchantUrl && !utils.isEnchantTicketLink(enchantUrl)) {
            return { error: "Invalid Enchant ticket URL" };
        }

        tournament.enchantUrl = enchantUrl || undefined;

        const logMessage = enchantUrl ? `Updated Enchant ticket URL: **${enchantUrl}**` : "Cleared Enchant ticket URL";
        await this.addTournamentLog(tournament, currentUser, logMessage, "link");
        await LogService.generate(
            currentUser.id,
            `Updated Enchant ticket URL for **${tournament.name}**`,
            "tournament",
        );

        return {};
    }

    /**
     * Update tournament dates
     */
    public async updateDates(
        tournament: ITournament,
        startDate: Date,
        endDate: Date,
        currentUser: IUser,
    ): Promise<{ error?: string }> {
        if (startDate && endDate && startDate > endDate) {
            return { error: "Start date must be before end date" };
        }

        tournament.startDate = startDate;
        tournament.endDate = endDate;

        await this.addTournamentLog(
            tournament,
            currentUser,
            `Updated start and end date: **${dayjs(startDate).format("YYYY-MM-DD")}** — **${dayjs(endDate).format(
                "YYYY-MM-DD",
            )}**`,
            "calendar",
        );
        await LogService.generate(
            currentUser.id,
            `Updated start and end date for **${tournament.name}**`,
            "tournament",
        );

        return {};
    }

    /**
     * Update tournament tags
     */
    public async updateTags(tournament: ITournament, tags: string[], actioner: IUser): Promise<{ error?: string }> {
        tournament.tags = tags.map((tag: string) => tag.toLowerCase());

        await this.addTournamentLog(
            tournament,
            actioner,
            `Updated tags: ${tags.map((tag: string) => `\`${tag}\``).join(", ")}`,
            "tag",
        );
        await LogService.generate(actioner.id, `Updated tags for **${tournament.name}**`, "tournament");

        return {};
    }

    /**
     * Update tournament banner
     */
    public async updateBanner(
        tournament: ITournament,
        bannerUrl: string,
        actioner: IUser,
    ): Promise<{ error?: string }> {
        if (!utils.isValidUrl(bannerUrl)) {
            return { error: "Banner URL must be a valid URL" };
        }
        tournament.bannerUrl = bannerUrl;

        await this.addTournamentLog(tournament, actioner, `Updated banner`, "image");
        await LogService.generate(actioner.id, `Updated banner for **${tournament.name}**`, "tournament");

        return {};
    }

    /**
     * Update tournament winners
     */
    public async updateWinners(
        tournament: ITournament,
        winners: IUser[],
        currentUser: IUser,
    ): Promise<{ error?: string }> {
        const winnerIds = winners.map((w) => w._id || w);
        const populatedWinners = await User.find({ _id: { $in: winnerIds } }).populate("infringements");

        tournament.winners = winners;

        const winnerUsers = populatedWinners;

        await this.addTournamentLog(
            tournament,
            currentUser,
            `Updated winners: ${winnerUsers.map((w: IUser) => `[**${w.username}**](${w.osuProfileUrl})`).join(", ")}`,
            "trophy",
        );
        await LogService.generate(currentUser.id, `Updated winners for **${tournament.name}**`, "tournament");

        return {};
    }

    /**
     * Update tournament status
     */
    public async updateStatus(
        tournament: ITournament,
        status: TournamentStatus,
        currentUser: IUser,
        sessionData: any,
    ): Promise<{ error?: string }> {
        const oldStatus = tournament.status;

        // Block "badgeApproved" status if any host has an active infringement
        if (status === "badgeApproved") {
            const hostsWithInfringements = tournament.hosts.filter((host: IUser) => host.activeInfringement);
            if (hostsWithInfringements.length > 0) {
                const hostnames = utils.formatHostsList(hostsWithInfringements);
                return { error: `Cannot approve badges for hosts with active infringements: ${hostnames}` };
            }
        }

        tournament.status = status;

        if (status === "reviewOngoing") {
            tournament.startedReviewAt = new Date();
        }

        // Logging
        await this.addTournamentLog(tournament, currentUser, `Updated status to **${startCase(status)}**`, "flag");
        await LogService.generate(currentUser.id, `Updated status for **${tournament.name}**`, "tournament");

        // osu! message
        const excludedStatusesOsu = ["supportRequestReceived", "screeningConcluded", "onHold"];
        let shouldSendOsuMessage = !excludedStatusesOsu.includes(status);

        if (status === "reviewOngoing" && oldStatus === "onHold") {
            shouldSendOsuMessage = false;
        }

        if (shouldSendOsuMessage) {
            let message = `The official support status of your ${tournament.type}: **${
                tournament.name
            }** has been updated to **${startCase(
                status,
            )}**.\n\n[View your ${tournament.type} in the Tournament Tracker by clicking here](${config.baseUrl}/tournaments/${
                tournament._id
            }).`;

            if (status === "screeningConcluded") {
                message += `\n\nPlease check your email for more information about potentially screened-out players.`;
            } else if (status === "changesRequested") {
                message += `\n\nPlease check your email for more information about the changes requested, or visit the [Tournament Tracker](${config.baseUrl}/tournaments/${tournament._id}) for a brief overview of the changes.`;
            } else if (status === "badgeApproved") {
                message += `\n\nCongratulations! Your ${tournament.type} has been approved for badge support! You will receive an email with more information soon.`;
            } else if (status === "badgeRejected") {
                message += `\n\nUnfortunately, your ${tournament.type} has been rejected for badge support. You will receive an email with more information soon.`;
            }

            const hostOsuIds = tournament.hosts.map((host: IUser) => host.osuId);
            try {
                await NotificationDispatchService.enqueueOsuAnnouncement({
                    userIds: hostOsuIds,
                    message: {
                        channel: {
                            name: `${capitalize(tournament.type)} Status Update`,
                            description: `Update regarding: ${tournament.name}`,
                        },
                        content: message,
                    },
                    fallbackId: currentUser.osuId,
                });
            } catch {
                // enqueue failures were previously swallowed as ErrorResponse
            }
        }

        // Discord
        const excludedStatusesDiscord = ["supportRequestReceived", "screeningConcluded", "reviewOngoing"];

        if (!excludedStatusesDiscord.includes(status) || (status === "reviewOngoing" && oldStatus === "onHold")) {
            let embedColor = DiscordUtils.webhookColors.orange;

            if (status === "supportRequestReceived") embedColor = DiscordUtils.webhookColors.lightPurple;
            if (status === "screeningConcluded") embedColor = DiscordUtils.webhookColors.blue;
            if (status === "changesRequested") embedColor = DiscordUtils.webhookColors.yellow;
            if (status === "onHold") embedColor = DiscordUtils.webhookColors.darkPink;
            if (status === "badgeApproved") embedColor = DiscordUtils.webhookColors.lightGreen;
            if (status === "badgeRejected") embedColor = DiscordUtils.webhookColors.lightRed;
            if (status === "noBadgeRequested") embedColor = DiscordUtils.webhookColors.gray;

            const embed = new EmbedBuilder()
                .setAuthor(DiscordUtils.defaultWebhookAuthor(sessionData))
                .setColor(embedColor)
                .setDescription(
                    `Updated status for ${tournament.type}: [**${tournament.name}**](${config.baseUrl}/tournaments/${tournament._id})`,
                )
                .addField("New Status", `${startCase(status)}`);

            const webhookBuilder = new WebhookBuilder().addEmbed(embed);

            if (tournament.threadId && tournament.threadId.length > 0) {
                webhookBuilder.setThreadId(tournament.threadId);
            }

            await webhookBuilder.send();
        }

        return {};
    }

    /**
     * Update tournament active status
     */
    public async updateIsActive(
        tournament: ITournament,
        isActive: boolean,
        currentUser: IUser,
        sessionData: any,
    ): Promise<{ error?: string }> {
        tournament.isActive = isActive;

        await this.addTournamentLog(
            tournament,
            currentUser,
            `${isActive ? "Unarchived" : "Archived"} tournament`,
            "archive",
        );
        await LogService.generate(currentUser.id, `Updated active status for **${tournament.name}**`, "tournament");

        // Discord
        const embed = new EmbedBuilder()
            .setAuthor(DiscordUtils.defaultWebhookAuthor(sessionData))
            .setColor(isActive ? DiscordUtils.webhookColors.gray : DiscordUtils.webhookColors.black)
            .setDescription(
                `${isActive ? "Unarchived" : "Archived"} ${tournament.type}: [**${tournament.name}**](${
                    config.baseUrl
                }/tournaments/${tournament._id})`,
            );

        const webhookBuilder = new WebhookBuilder().addEmbed(embed);

        if (tournament.threadId && tournament.threadId.length > 0) {
            webhookBuilder.setThreadId(tournament.threadId);
        }

        await webhookBuilder.send();

        return {};
    }
}

/** Singleton for non-DI callers (Express controllers, UsersService). */
export default new TournamentService();
