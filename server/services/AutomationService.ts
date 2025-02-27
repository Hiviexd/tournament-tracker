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

class AutomationService {
    private checkOverdueVotingsJob: CronJob;
    private checkConcludableVotingsJob: CronJob;
    private checkStaleTicketsJob: CronJob;

    constructor() {
        // Run at 17:00 UTC every day
        this.checkOverdueVotingsJob = new CronJob("0 17 * * *", this.checkOverdueVotings.bind(this));

        // Run every hour
        this.checkConcludableVotingsJob = new CronJob("0 * * * *", this.checkConcludableVotings.bind(this));

        // Run at 18:00 UTC every day
        this.checkStaleTicketsJob = new CronJob("0 18 * * *", this.checkStaleTickets.bind(this));
    }

    public start() {
        if (!config.automation) return;

        this.checkOverdueVotingsJob.start();
        this.checkConcludableVotingsJob.start();
        this.checkStaleTicketsJob.start();

        console.log(styles("✓ Automation service started!", ["green", "bold", "underline"]));

        // Run immediately for testing
        if (process.env.AUTOMATION_DEBUG === "true") {
            console.log(styles("Running automation checks immediately...", ["yellow", "bold"]));
            this.checkOverdueVotings();
            this.checkConcludableVotings();
            this.checkStaleTickets();
        }
    }

    private async checkOverdueVotings() {
        const activeVotings = await Voting.find({ isActive: true });

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
    }

    private async checkConcludableVotings() {
        const concludableVotings = await Voting.find({
            isActive: true,
            $expr: { $gte: [{ $size: "$votes" }, "$requiredVotes"] },
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
        }
    }

    private async checkStaleTickets() {
        const activeTickets = await Ticket.find({ isActive: true })
            .populate("messages")
            .populate("author", "username osuId")
            .populate("targetUser", "username osuId");

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
                await DiscordService.sendRoleHighlightWebhook(roles, [
                    {
                        color: webhookColors.red,
                        description: `[**${ticket.title}**](${ticketUrl}) has had no response in ${daysSinceLastResponse} days!`,
                        fields: [
                            { name: "Type", value: ticketType, inline: true },
                            { name: "Author", value: `[**${ticket.author.username}**](${ticket.author.osuProfileUrl})`, inline: true },
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
                await DiscordService.sendWebhook([
                    {
                        color: webhookColors.orange,
                        description: `[**${ticket.title}**](${ticketUrl}) has had no response in ${daysSinceLastResponse} days`,
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
    }
}

export default new AutomationService();
