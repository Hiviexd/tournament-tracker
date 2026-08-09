import BaseJob from "./BaseJob";
import Voting from "@tc/models/votingModel";
import dayjs from "@tc/utils/dayjs";
import config from "@tc/config";
import { EmbedBuilder } from "@tc/notifications/discord/EmbedBuilder";
import { WebhookBuilder } from "@tc/notifications/discord/WebhookBuilder";
import DiscordUtils from "@tc/notifications/discord/DiscordUtils";
import utils from "@tc/utils/server";
import User from "@tc/models/userModel";
import LogService from "@tc/models/LogService";
import { IVoting } from "@tc/types/Voting";

export default class VotingReminderJob extends BaseJob {
    name = "VotingReminder";
    schedule = "0 17 * * *"; // Run at 17:00 UTC every day

    protected async execute(): Promise<void> {
        const activeVotings = await Voting.find({ isActive: true }).populate([
            {
                path: "votes",
                populate: {
                    path: "author",
                    select: "username osuId discordId groups",
                },
            },
            {
                path: "abstainedUsers",
                select: "username osuId discordId groups",
            },
        ]);
        const votingsToNotify: IVoting[] = [];

        for (const voting of activeVotings) {
            const deadline = dayjs(voting.deadline);
            const now = dayjs();
            const hoursUntilDeadline = deadline.diff(now, "hours");
            const isOverdue = now.isAfter(deadline);
            const roles: string[] = [];

            if (voting.assignedGroups.includes("tc")) roles.push("tournament");
            if (voting.assignedGroups.includes("cc")) roles.push("contest");

            // Get all active users in the assigned groups
            const usersInAssignedGroups = await User.find({
                groups: { $in: voting.assignedGroups },
                isActiveVoter: true,
            }).select("username osuId discordId groups");

            // Get set of user IDs who have already voted or abstained
            const votedUserIds = new Set(voting.votes.map((vote) => vote.author._id.toString()));
            const abstainedUserIds = new Set(voting.abstainedUsers?.map((user) => user._id.toString()) || []);

            // Filter out users who have already voted or abstained
            const missingVotes = usersInAssignedGroups.filter(
                (user) => !votedUserIds.has(user._id.toString()) && !abstainedUserIds.has(user._id.toString()),
            );

            // Get Discord IDs for pinging (fall back to username if no Discord ID)
            const usersToPing = missingVotes.map((user) => user.discordId || user.username);

            if (hoursUntilDeadline <= 24 && !isOverdue) {
                // Almost due (within 24h) but not overdue yet
                votingsToNotify.push(voting);

                const minutesUntilDeadline = deadline.diff(now, "minutes");
                const dueText =
                    hoursUntilDeadline > 0
                        ? utils.formatCount(hoursUntilDeadline, "hour")
                        : utils.formatCount(minutesUntilDeadline, "minute");

                const embed = new EmbedBuilder()
                    .setColor(DiscordUtils.webhookColors.lightRed)
                    .setDescription(
                        `[**${voting.title}**](${config.baseUrl}/votes/${voting._id}) vote is due in ${dueText}!`,
                    )
                    .addField("Current Votes", voting.votes.length.toString(), true)
                    .addField("Required Votes", voting.requiredVotes.toString(), true)
                    .addField(
                        "Deadline",
                        `${utils.discordTimestamp(voting.deadline)} (${utils.discordTimestamp(
                            voting.deadline,
                            "dateTime",
                        )})`,
                        false,
                    )
                    .addField(
                        "Missing Voters",
                        missingVotes.map((user) => `[**${user.username}**](${user.osuProfileUrl})`).join(", ") ||
                            "None",
                        false,
                    );

                await new WebhookBuilder().addEmbed(embed).send();
            } else if (isOverdue) {
                // Only send overdue notification if actually past deadline
                votingsToNotify.push(voting);

                const overdueDuration = Math.abs(hoursUntilDeadline);
                const overdueText =
                    overdueDuration >= 24
                        ? utils.formatCount(Math.floor(overdueDuration / 24), "day")
                        : utils.formatCount(overdueDuration, "hour");

                const overdueEmbed = new EmbedBuilder()
                    .setColor(DiscordUtils.webhookColors.red)
                    .setDescription(
                        `[**${voting.title}**](${config.baseUrl}/votes/${voting._id}) vote is overdue by ${overdueText}!`,
                    )
                    .addField("Current Votes", voting.votes.length.toString(), true)
                    .addField("Required Votes", voting.requiredVotes.toString(), true)
                    .addField(
                        "Deadline",
                        `${utils.discordTimestamp(voting.deadline)} (${utils.discordTimestamp(
                            voting.deadline,
                            "dateTime",
                        )})`,
                        false,
                    )
                    .addField(
                        "Missing Voters",
                        missingVotes.map((user) => `[**${user.username}**](${user.osuProfileUrl})`).join(", ") ||
                            "None",
                        false,
                    );

                await new WebhookBuilder()
                    .addEmbed(overdueEmbed)
                    .addUsers(usersToPing)
                    .setMessage("Overdue Vote")
                    .send();
            } else {
                // Not overdue and not due soon - just send a regular update
                const activeEmbed = new EmbedBuilder()
                    .setColor(DiscordUtils.webhookColors.lightGreen)
                    .setDescription(
                        `[**${voting.title}**](${config.baseUrl}/votes/${voting._id}) vote is still active!`,
                    )
                    .addField("Current Votes", voting.votes.length.toString(), true)
                    .addField("Required Votes", voting.requiredVotes.toString(), true)
                    .addField(
                        "Deadline",
                        `${utils.discordTimestamp(voting.deadline)} (${utils.discordTimestamp(
                            voting.deadline,
                            "dateTime",
                        )})`,
                        false,
                    )
                    .addField(
                        "Missing Voters",
                        missingVotes.map((user) => `[**${user.username}**](${user.osuProfileUrl})`).join(", ") ||
                            "*None*",
                        false,
                    );

                await new WebhookBuilder().addEmbed(activeEmbed).send();
            }
        }

        if (votingsToNotify.length > 0) {
            await LogService.generateSystem(
                `Sent reminders for votes: ${votingsToNotify
                    .map((v) => `[**${v.title}**](${config.baseUrl}/votes/${v._id})`)
                    .join(", ")}`,
                "voting",
            );
        }

        this.setSuccessMessage(`Sent reminders for ${votingsToNotify.length} votings`);
    }
}
