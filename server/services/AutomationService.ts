import { CronJob } from "cron";
import Voting from "../models/votingModel";
import Ticket from "../models/ticketModel";
import moment from "moment";
import config from "../../config.json";
import DiscordService from "./DiscordService";
import webhookColors from "../constants/webhookColors";
import VotingService from "./VotingService";
import { styles } from "../helpers/consoleStyles";
import helpers from "../helpers/index";
import User from "../models/userModel";
import LogService from "./LogService";
import { IVoting } from "../../interfaces/Voting";
import { ITicket } from "../../interfaces/Ticket";
import { IUser } from "../../interfaces/User";

class AutomationService {
    private checkOverdueVotingsJob: CronJob;
    private checkConcludableVotingsJob: CronJob;
    private checkStaleTicketsJob: CronJob;
    private checkBadgeUpdatesJob: CronJob;

    constructor() {
        // Run every hour
        this.checkConcludableVotingsJob = new CronJob("0 * * * *", this.checkConcludableVotings.bind(this));

        // Run at 17:00 UTC every day
        this.checkOverdueVotingsJob = new CronJob("0 17 * * *", this.checkOverdueVotings.bind(this));

        // Run at 18:00 UTC every day
        this.checkStaleTicketsJob = new CronJob("0 18 * * *", this.checkStaleTickets.bind(this));

        // Run at 12:00 UTC every day
        this.checkBadgeUpdatesJob = new CronJob("0 12 * * *", this.checkBadgeUpdates.bind(this));
    }

    public start() {
        if (!config.automation) return;

        this.checkConcludableVotingsJob.start();
        this.checkOverdueVotingsJob.start();
        this.checkStaleTicketsJob.start();
        this.checkBadgeUpdatesJob.start();

        console.log(styles("✓ Automation service started!", ["green", "bold", "underline"]));

        // Run immediately for testing
        if (process.env.AUTOMATION_DEBUG === "true") {
            console.log(styles("Running automation checks immediately...", ["yellow", "bold"]));
            this.checkConcludableVotings();
            this.checkOverdueVotings();
            this.checkStaleTickets();
            this.checkBadgeUpdates();
        }
    }

    private async checkOverdueVotings() {
        const activeVotings = await Voting.find({ isActive: true });
        const overdueVotings: IVoting[] = [];

        for (const voting of activeVotings) {
            const deadline = moment(voting.deadline);
            const now = moment();
            const hoursUntilDeadline = deadline.diff(now, "hours");
            const isOverdue = now.isAfter(deadline);
            const roles: string[] = [];

            if (voting.assignedGroups.includes("tc")) roles.push("tournament");
            if (voting.assignedGroups.includes("cc")) roles.push("contest");

            if (hoursUntilDeadline <= 24 && !isOverdue) {
                // Almost due (within 24h) but not overdue yet
                overdueVotings.push(voting);

                const minutesUntilDeadline = deadline.diff(now, "minutes");
                const dueText =
                    hoursUntilDeadline > 0 ? `${hoursUntilDeadline} hours` : `${minutesUntilDeadline} minutes`;

                await DiscordService.sendWebhook([
                    {
                        color: webhookColors.lightRed,
                        description: `[**${voting.title}**](${config.baseUrl}/votes/${voting._id}) vote is due in ${dueText}!`,
                        fields: [
                            { name: "Current Votes", value: voting.votes.length.toString(), inline: true },
                            { name: "Required Votes", value: voting.requiredVotes.toString(), inline: true },
                            {
                                name: "Deadline",
                                value: `${helpers.discordTimestamp(voting.deadline)} (${helpers.discordTimestamp(
                                    voting.deadline,
                                    "dateTime"
                                )})`,
                                inline: false,
                            },
                        ],
                    },
                ]);
            } else if (isOverdue) {
                // Only send overdue notification if actually past deadline
                overdueVotings.push(voting);

                const overdueDuration = Math.abs(hoursUntilDeadline);
                const overdueText =
                    overdueDuration >= 24 ? `${Math.floor(overdueDuration / 24)} days` : `${overdueDuration} hours`;

                await DiscordService.sendRoleHighlightWebhook(roles, [
                    {
                        color: webhookColors.red,
                        description: `[**${voting.title}**](${config.baseUrl}/votes/${voting._id}) vote is overdue by ${overdueText}!`,
                        fields: [
                            { name: "Current Votes", value: voting.votes.length.toString(), inline: true },
                            { name: "Required Votes", value: voting.requiredVotes.toString(), inline: true },
                            {
                                name: "Deadline",
                                value: `${helpers.discordTimestamp(voting.deadline)} (${helpers.discordTimestamp(
                                    voting.deadline,
                                    "dateTime"
                                )})`,
                                inline: false,
                            },
                        ],
                    },
                ]);
            }
        }

        if (overdueVotings.length > 0) {
            await LogService.generateSystem(
                `Sent reminders for overdue votes: ${overdueVotings
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
            await voting.save();

            // Send Discord notification
            const fields = VotingService.generateVotingResults(voting);

            await DiscordService.sendWebhook([
                {
                    color: webhookColors.darkYellow,
                    description: `[**${voting.title}**](${config.baseUrl}/votes/${voting._id}) vote has been automatically concluded!`,
                    fields: [...fields],
                },
            ]);

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

            const roles: string[] = [];
            if (ticket.assignedGroup === "tc") roles.push("tournament");
            if (ticket.assignedGroup === "cc") roles.push("contest");

            const ticketType = ticket.type === "report" ? "Report" : "Ticket";
            const ticketUrl = `${config.baseUrl}/tickets/${ticket._id}`;

            if (daysSinceLastResponse >= 10) {
                // 10+ days - send with ping
                staleTickets.push(ticket);

                await DiscordService.sendRoleHighlightWebhook(roles, [
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
                                value: helpers.discordTimestamp(ticket.lastResponseAt),
                                inline: false,
                            },
                        ],
                    },
                ]);
            } else {
                // 7-9 days - send without ping
                staleTickets.push(ticket);

                await DiscordService.sendWebhook([
                    {
                        color: webhookColors.orange,
                        description: `[**${ticket.title}**](${ticketUrl}) has had no response for ${daysSinceLastResponse} days!`,
                        fields: [
                            { name: "Type", value: ticketType, inline: true },
                            { name: "Author", value: ticket.author.username, inline: true },
                            {
                                name: "Last Response",
                                value: helpers.discordTimestamp(ticket.lastResponseAt),
                                inline: false,
                            },
                        ],
                    },
                ]);
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
            const tcYears = helpers.getYearsFromDays(user.tcDuration);
            const ccYears = helpers.getYearsFromDays(user.ccDuration);

            // Skip if badge is up to date
            if (user.groups.includes("tc") && user.badgeValue === tcYears) continue;
            if (user.groups.includes("cc") && user.badgeValue === ccYears) continue;

            const committee = user.groups.includes("tc") ? "tc" : "cc";
            const years = committee === "tc" ? tcYears : ccYears;
            const commandString = helpers.generateBadgeCommand(user.osuId, years, user.badgeValue, committee);

            badgeUpdates.push(user);

            await DiscordService.sendUserHighlightWebhook(usersToPing, [
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
            ]);
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
}

export default new AutomationService();
