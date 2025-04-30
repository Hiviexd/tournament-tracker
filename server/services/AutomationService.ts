import { CronJob } from "cron";
import Voting from "../models/votingModel";
import Ticket from "../models/ticketModel";
import Tournament from "../models/tournamentModel";
import moment from "moment";
import config from "../../config.json";
import DiscordService from "./DiscordService";
import webhookColors from "../constants/webhookColors";
import VotingService from "./VotingService";
import utils from "../../utils";
import User from "../models/userModel";
import LogService from "./LogService";
import { IVoting } from "../../interfaces/Voting";
import { ITicket } from "../../interfaces/Ticket";
import { IUser } from "../../interfaces/User";
import { ITournament } from "../../interfaces/Tournament";

class AutomationService {
    private checkVotingsJob: CronJob;
    private checkConcludableVotingsJob: CronJob;
    private checkStaleTicketsJob: CronJob;
    private checkBadgeUpdatesJob: CronJob;
    private checkOverdueReviewsJob: CronJob;

    constructor() {
        // Run every hour
        this.checkConcludableVotingsJob = new CronJob("0 * * * *", this.checkConcludableVotings.bind(this));

        // Run at 17:00 UTC every day
        this.checkVotingsJob = new CronJob("0 17 * * *", this.checkVotings.bind(this));

        // Run at 18:00 UTC every day
        this.checkStaleTicketsJob = new CronJob("0 18 * * *", this.checkStaleTickets.bind(this));

        // Run at 12:00 UTC every day
        this.checkBadgeUpdatesJob = new CronJob("0 12 * * *", this.checkBadgeUpdates.bind(this));

        // Run at 16:00 UTC every day
        this.checkOverdueReviewsJob = new CronJob("0 16 * * *", this.checkOverdueReviews.bind(this));
    }

    public start() {
        if (!config.automation) return;

        this.checkConcludableVotingsJob.start();
        this.checkVotingsJob.start();
        this.checkStaleTicketsJob.start();
        this.checkBadgeUpdatesJob.start();
        this.checkOverdueReviewsJob.start();

        console.log(utils.consoleStyles("✓ Automation service started!", ["green", "bold", "underline"]));

        // Run immediately for testing
        if (process.env.AUTOMATION_DEBUG === "true") {
            console.log(utils.consoleStyles("Running automation checks immediately...", ["yellow", "bold"]));
            this.checkConcludableVotings();
            this.checkVotings();
            this.checkStaleTickets();
            this.checkBadgeUpdates();
            this.checkOverdueReviews();
        }
    }

    private async checkVotings() {
        const activeVotings = await Voting.find({ isActive: true }).populate({
            path: "votes",
            populate: {
                path: "author",
                select: "username osuId discordId groups",
            },
        });
        const votingsToNotify: IVoting[] = [];

        for (const voting of activeVotings) {
            const deadline = moment(voting.deadline);
            const now = moment();
            const hoursUntilDeadline = deadline.diff(now, "hours");
            const isOverdue = now.isAfter(deadline);
            const roles: string[] = [];

            if (voting.assignedGroups.includes("tc")) roles.push("tournament");
            if (voting.assignedGroups.includes("cc")) roles.push("contest");

            // Get all active users in the assigned groups
            const usersInAssignedGroups = await User.find({
                groups: { $in: voting.assignedGroups },
                isActiveReviewer: true,
            }).select("username osuId discordId groups");

            // Get set of user IDs who have already voted
            const votedUserIds = new Set(voting.votes.map((vote) => vote.author._id.toString()));

            // Filter out users who have already voted
            const missingVotes = usersInAssignedGroups.filter((user) => !votedUserIds.has(user._id.toString()));

            // Get Discord IDs for pinging (fall back to username if no Discord ID)
            const usersToPing = missingVotes.map((user) => user.discordId || user.username);

            if (hoursUntilDeadline <= 24 && !isOverdue) {
                // Almost due (within 24h) but not overdue yet
                votingsToNotify.push(voting);

                const minutesUntilDeadline = deadline.diff(now, "minutes");
                const dueText =
                    hoursUntilDeadline > 0 ? `${hoursUntilDeadline} hours` : `${minutesUntilDeadline} minutes`;

                await DiscordService.sendWebhook({
                    embeds: [
                        {
                            color: webhookColors.lightRed,
                            description: `[**${voting.title}**](${config.baseUrl}/votes/${voting._id}) vote is due in ${dueText}!`,
                            fields: [
                                { name: "Current Votes", value: voting.votes.length.toString(), inline: true },
                                { name: "Required Votes", value: voting.requiredVotes.toString(), inline: true },
                                {
                                    name: "Deadline",
                                    value: `${utils.discordTimestamp(voting.deadline)} (${utils.discordTimestamp(
                                        voting.deadline,
                                        "dateTime"
                                    )})`,
                                    inline: false,
                                },
                                {
                                    name: "Missing Voters",
                                    value:
                                        missingVotes
                                            .map((user) => `[**${user.username}**](${user.osuProfileUrl})`)
                                            .join(", ") || "None",
                                    inline: false,
                                },
                            ],
                        },
                    ],
                });
            } else if (isOverdue) {
                // Only send overdue notification if actually past deadline
                votingsToNotify.push(voting);

                const overdueDuration = Math.abs(hoursUntilDeadline);
                const overdueText =
                    overdueDuration >= 24 ? `${Math.floor(overdueDuration / 24)} days` : `${overdueDuration} hours`;

                await DiscordService.sendUserHighlightWebhook({
                    users: usersToPing,
                    embeds: [
                        {
                            color: webhookColors.red,
                            description: `[**${voting.title}**](${config.baseUrl}/votes/${voting._id}) vote is overdue by ${overdueText}!`,
                            fields: [
                                { name: "Current Votes", value: voting.votes.length.toString(), inline: true },
                                { name: "Required Votes", value: voting.requiredVotes.toString(), inline: true },
                                {
                                    name: "Deadline",
                                    value: `${utils.discordTimestamp(voting.deadline)} (${utils.discordTimestamp(
                                        voting.deadline,
                                        "dateTime"
                                    )})`,
                                    inline: false,
                                },
                                {
                                    name: "Missing Voters",
                                    value:
                                        missingVotes
                                            .map((user) => `[**${user.username}**](${user.osuProfileUrl})`)
                                            .join(", ") || "None",
                                    inline: false,
                                },
                            ],
                        },
                    ],
                    message: "Overdue Vote",
                });
            } else {
                // Not overdue and not due soon - just send a regular update
                await DiscordService.sendWebhook({
                    embeds: [
                        {
                            color: webhookColors.lightGreen,
                            description: `[**${voting.title}**](${config.baseUrl}/votes/${voting._id}) vote is still active!`,
                            fields: [
                                { name: "Current Votes", value: voting.votes.length.toString(), inline: true },
                                { name: "Required Votes", value: voting.requiredVotes.toString(), inline: true },
                                {
                                    name: "Deadline",
                                    value: `${utils.discordTimestamp(voting.deadline)} (${utils.discordTimestamp(
                                        voting.deadline,
                                        "dateTime"
                                    )})`,
                                    inline: false,
                                },
                                {
                                    name: "Missing Voters",
                                    value:
                                        missingVotes
                                            .map((user) => `[**${user.username}**](${user.osuProfileUrl})`)
                                            .join(", ") || "*None*",
                                    inline: false,
                                },
                            ],
                        },
                    ],
                });
            }
        }

        if (votingsToNotify.length > 0) {
            await LogService.generateSystem(
                `Sent reminders for votes: ${votingsToNotify
                    .map((v) => `[**${v.title}**](${config.baseUrl}/votes/${v._id})`)
                    .join(", ")}`,
                "voting"
            );
        }
    }

    private async checkConcludableVotings() {
        const now = moment();
        const concludableVotings = await Voting.find({
            isActive: true,
            $expr: {
                $and: [
                    // Check if required votes are met
                    { $gte: [{ $size: "$votes" }, "$requiredVotes"] },
                    // Check if deadline has passed (createdAt + duration days < now)
                    {
                        $lt: [
                            {
                                $add: [
                                    "$createdAt",
                                    { $multiply: ["$duration", 24 * 60 * 60 * 1000] }, // Convert days to milliseconds
                                ],
                            },
                            now.toDate(),
                        ],
                    },
                ],
            },
        }).populate("votes");

        for (const voting of concludableVotings) {
            // Conclude the voting
            voting.isActive = false;
            voting.concludedAt = now.toDate();
            await voting.save();

            // Send Discord notification
            const fields = VotingService.generateVotingResults(voting);

            await DiscordService.sendWebhook({
                embeds: [
                    {
                        color: webhookColors.darkYellow,
                        description: `[**${voting.title}**](${config.baseUrl}/votes/${voting._id}) vote has been automatically concluded!`,
                        fields: [...fields],
                    },
                ],
            });

            await LogService.generateSystem(
                `Automatically concluded vote [**${voting.title}**](${config.baseUrl}/votes/${voting._id})`,
                "voting"
            );
        }
    }

    private async checkStaleTickets() {
        const activeTickets = await Ticket.find({ isActive: true })
            .populate("messages")
            .populate("author", "username osuId")
            .populate("targetUser", "username osuId");

        const staleTickets: ITicket[] = [];

        for (const ticket of activeTickets) {
            const lastResponse = moment(ticket.lastResponseAt);
            const now = moment();
            const daysSinceLastResponse = now.diff(lastResponse, "days");

            // Skip if less than 7 days old
            if (daysSinceLastResponse < 7) continue;

            // Skip if last non-note message is from committee
            const messages = ticket.messages.filter((message) => !message.isNote);
            const lastMessage = messages[messages.length - 1];
            if (lastMessage.isCommittee) continue;

            const ticketType = ticket.type === "report" ? "Report" : "Ticket";
            const ticketUrl = `${config.baseUrl}/tickets/${ticket._id}`;

            if (daysSinceLastResponse >= 10) {
                // 10+ days - send with ping
                staleTickets.push(ticket);

                // ping the committee members who sent messages in the ticket
                const usersToPing = new Set<string>();

                ticket.messages.forEach((message) => {
                    if (message.author.isCommittee) {
                        usersToPing.add(message.author.discordId || message.author.username);
                    }
                });

                await DiscordService.sendUserHighlightWebhook({
                    users: Array.from(usersToPing),
                    embeds: [
                        {
                            color: webhookColors.red,
                            description: `[**${ticket.title}**](${ticketUrl}) has had no response for ${daysSinceLastResponse} days!`,
                            fields: [
                                { name: "Type", value: ticketType, inline: true },
                                {
                                    name: "Author",
                                    value: `[**${ticket.author.username}**](${ticket.author.osuProfileUrl})`,
                                    inline: true,
                                },
                                {
                                    name: "Last Response",
                                    value: utils.discordTimestamp(ticket.lastResponseAt),
                                    inline: false,
                                },
                            ],
                        },
                    ],
                    message: "Stale Ticket",
                    threadId: ticket.threadId,
                });
            } else {
                // 7-9 days - send without ping
                staleTickets.push(ticket);

                await DiscordService.sendWebhook({
                    embeds: [
                        {
                            color: webhookColors.orange,
                            description: `[**${ticket.title}**](${ticketUrl}) has had no response for ${daysSinceLastResponse} days!`,
                            fields: [
                                { name: "Type", value: ticketType, inline: true },
                                { name: "Author", value: ticket.author.username, inline: true },
                                {
                                    name: "Last Response",
                                    value: utils.discordTimestamp(ticket.lastResponseAt),
                                    inline: false,
                                },
                            ],
                        },
                    ],
                    threadId: ticket.threadId,
                });
            }
        }

        if (staleTickets.length > 0) {
            await LogService.generateSystem(
                `Sent reminders for stale tickets: ${staleTickets
                    .map((t) => `[**${t.title}**](${config.baseUrl}/tickets/${t._id})`)
                    .join(", ")}`,
                "ticket"
            );
        }
    }

    private async checkBadgeUpdates() {
        const badgeUpdates: IUser[] = [];
        const activeCommitteeMembers = await User.find({
            groups: { $in: ["tc", "cc"] },
        });

        const hivie = await User.findByUsernameOrOsuId(14102976);
        const chillier = await User.findByUsernameOrOsuId(9501251);

        if (!hivie?.discordId || !chillier?.discordId) {
            console.error("Could not find Discord IDs for badge managers");
            return;
        }

        const usersToPing = [hivie.discordId, chillier.discordId];

        for (const user of activeCommitteeMembers) {
            const tcYears = utils.getYearsFromDays(user.tcDuration);
            const ccYears = utils.getYearsFromDays(user.ccDuration);

            // Skip if badge is up to date
            if (user.groups.includes("tc") && user.badgeValue === tcYears) continue;
            if (user.groups.includes("cc") && user.badgeValue === ccYears) continue;

            const committee = user.groups.includes("tc") ? "tc" : "cc";
            const years = committee === "tc" ? tcYears : ccYears;
            const commandString = utils.generateBadgeCommand(user.osuId, years, user.badgeValue, committee);

            badgeUpdates.push(user);

            await DiscordService.sendUserHighlightWebhook({
                users: usersToPing,
                embeds: [
                    {
                        color: webhookColors.orange,
                        description: `[**${user.username}**](${config.baseUrl}/users?id=${user.osuId}) needs a badge update!`,
                        fields: [
                            { name: "Current Badge", value: user.badgeValue.toString(), inline: true },
                            { name: "Eligible Years", value: years.toString(), inline: true },
                            { name: "Team", value: committee.toUpperCase(), inline: true },
                            { name: "Command", value: `\`\`\`${commandString}\`\`\``, inline: false },
                        ],
                    },
                ],
            });
        }

        if (badgeUpdates.length > 0) {
            await LogService.generateSystem(
                `Sent badge update requests for users: ${badgeUpdates
                    .map((u) => `[**${u.username}**](${config.baseUrl}/users?id=${u.osuId})`)
                    .join(", ")}`,
                "user"
            );
        }
    }

    private async checkOverdueReviews() {
        // Get all active tournaments with reviewOngoing status
        const activeTournaments = await Tournament.find({
            isActive: true,
            status: "reviewOngoing",
            startedReviewAt: { $exists: true },
        }).populate([
            {
                path: "assignedReviewers",
                select: "username osuId discordId isActiveReviewer",
            },
            {
                path: "reviews",
                select: "author",
                populate: {
                    path: "author",
                    select: "username osuId",
                },
            },
        ]);

        const overdueReviews: Array<{
            tournament: ITournament;
            daysSinceReview: number;
            missingReviewers: IUser[];
        }> = [];

        for (const tournament of activeTournaments) {
            // Skip if no startedReviewAt date
            if (!tournament.startedReviewAt) continue;

            const reviewStartDate = moment(tournament.startedReviewAt);
            const now = moment();
            const daysSinceReview = now.diff(reviewStartDate, "days");

            // Skip if less than 7 days old
            if (daysSinceReview < 7) continue;

            // Skip if no assigned reviewers
            if (!tournament.assignedReviewers?.length) continue;

            // Get set of user IDs who have already reviewed
            const reviewedUserIds = new Set(tournament.reviews?.map((review) => review.author?._id.toString()) || []);

            // Filter out users who have already reviewed
            const missingReviewers = tournament.assignedReviewers.filter(
                (reviewer) => !reviewedUserIds.has(reviewer._id.toString())
            );

            // Filter out users who have already reviewed and are inactive reviewers
            const missingReviewersExcludingInactive = missingReviewers.filter((reviewer) => reviewer.isActiveReviewer);

            if (missingReviewers.length === 0) continue;

            // Get Discord IDs for pinging only active reviewers (fall back to username if no Discord ID)
            const usersToPing = missingReviewersExcludingInactive.map((user) => user.discordId || user.username);

            // Determine notification color based on days overdue
            let color = webhookColors.lightOrange;
            if (daysSinceReview >= 18) color = webhookColors.darkRed;
            else if (daysSinceReview >= 15) color = webhookColors.red;
            else if (daysSinceReview >= 12) color = webhookColors.lightRed;

            // Only send notifications on specific days or if 18+ days old
            if (
                daysSinceReview === 7 ||
                daysSinceReview === 12 ||
                daysSinceReview === 15 ||
                daysSinceReview === 17 ||
                daysSinceReview >= 18
            ) {
                overdueReviews.push({ tournament, daysSinceReview, missingReviewers });

                await DiscordService.sendUserHighlightWebhook({
                    users: usersToPing,
                    embeds: [
                        {
                            color,
                            description: `Review for ${tournament.type} [**${tournament.name}**](${config.baseUrl}/tournaments/${tournament._id}) has been ongoing for ${daysSinceReview} days!`,
                            fields: [
                                {
                                    name: "Missing Reviews",
                                    value: missingReviewers
                                        .map(
                                            (reviewer) =>
                                                `[**${reviewer.username}**](${reviewer.osuProfileUrl})${
                                                    reviewer.isActiveReviewer ? "" : " *(inactive)*"
                                                }`
                                        )
                                        .join(", "),
                                },
                                {
                                    name: "Review Started",
                                    value: `${utils.discordTimestamp(
                                        tournament.startedReviewAt
                                    )} (${utils.discordTimestamp(tournament.startedReviewAt, "dateTime")})`,
                                },
                            ],
                        },
                    ],
                    message: "Overdue Tournament Review",
                    threadId: tournament.threadId,
                });
            }
        }

        if (overdueReviews.length > 0) {
            await LogService.generateSystem(
                `Sent reminders for overdue reviews: ${overdueReviews
                    .map(
                        ({ tournament }) => `[**${tournament.name}**](${config.baseUrl}/tournaments/${tournament._id})`
                    )
                    .join(", ")}`,
                "tournament"
            );
        }
    }
}

export default new AutomationService();
