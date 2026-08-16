import BaseJob from "./BaseJob";
import Voting from "../models/votingModel";
import dayjs from "@tc/utils/dayjs";
import config from "@tc/config";
import { EmbedBuilder } from "../services/discord/EmbedBuilder";
import { WebhookBuilder } from "../services/discord/WebhookBuilder";
import DiscordUtils from "../services/discord/DiscordUtils";
import utils, { getSanctionApplyState } from "@tc/utils/server";
import LogService from "../services/LogService";
import { IVoting } from "@tc/types/Voting";

export default class PendingSanctionReminderJob extends BaseJob {
    name = "PendingSanctionReminder";
    schedule = "5 17 * * *"; // Run at 17:05 UTC every day

    protected async execute(): Promise<void> {
        const pendingVotings = await Voting.find({
            isSanctionVote: true,
            isActive: false,
            sanctionAppliedAt: { $exists: false },
        }).populate([{ path: "votes" }, { path: "targetUsers", select: "username osuId" }]);

        const votingsToNotify: IVoting[] = [];

        for (const voting of pendingVotings) {
            const state = getSanctionApplyState(voting);
            if (!state.showButton || state.disabled) continue;

            votingsToNotify.push(voting);

            const concludedAt = voting.concludedAt ?? voting.deadline;
            const daysSinceConcluded = Math.max(0, dayjs().diff(dayjs(concludedAt), "days"));
            const concludedText =
                daysSinceConcluded === 0 ? "today" : `${utils.formatCount(daysSinceConcluded, "day")} ago`;

            const embed = new EmbedBuilder()
                .setColor(DiscordUtils.webhookColors.red)
                .setDescription(
                    `[**${voting.title}**](${config.baseUrl}/votes/${voting._id}) sanction vote concluded ${concludedText} but the sanction has not been applied!`,
                );

            if (voting.targetUsers?.length) {
                embed.addField(
                    voting.targetUsers.length === 1 ? "Target User" : "Target Users",
                    utils.formatHostsList(voting.targetUsers, { mdLinks: true }),
                );
            }

            if (state.phrase || state.winnerOption) {
                embed.addField("Outcome", state.phrase ?? state.winnerOption!, true);
            }

            embed.addField(
                "Concluded",
                `${utils.discordTimestamp(concludedAt)} (${utils.discordTimestamp(concludedAt, "dateTime")})`,
            );

            await new WebhookBuilder().addEmbed(embed).send();
        }

        if (votingsToNotify.length > 0) {
            await LogService.generateSystem(
                `Sent reminders for unapplied sanctions: ${votingsToNotify
                    .map((v) => `[**${v.title}**](${config.baseUrl}/votes/${v._id})`)
                    .join(", ")}`,
                "voting",
            );
        }

        this.setSuccessMessage(`Sent reminders for ${votingsToNotify.length} pending sanctions`);
    }
}
