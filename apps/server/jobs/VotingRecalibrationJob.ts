import BaseJob from "./BaseJob";
import Voting from "../models/votingModel";
import config from "@tc/config";
import { WebhookBuilder } from "../services/discord/WebhookBuilder";
import VotingService from "../services/VotingService";
import LogService from "../services/LogService";

export default class VotingRecalibrationJob extends BaseJob {
    name = "VotingRecalibration";
    schedule = "50 16 * * *"; // Run at 16:50 UTC every day, before voting reminders

    protected async execute(): Promise<void> {
        const activeVotings = await Voting.find({ isActive: true }).populate("abstainedUsers");

        const changedVotings: { title: string; id: string; previous: number; next: number }[] = [];
        let unchangedCount = 0;

        for (const voting of activeVotings) {
            const result = await VotingService.recalibrateRequiredVotes(voting);

            if (!result.changed) {
                unchangedCount++;
                continue;
            }

            changedVotings.push({
                title: voting.title,
                id: voting.id,
                previous: result.previous,
                next: result.next,
            });

            await new WebhookBuilder().addEmbed(VotingService.buildRecalibrationEmbed(voting, result)).send();
        }

        if (changedVotings.length > 0) {
            await LogService.generateSystem(
                `Recalibrated required votes for: ${changedVotings
                    .map((v) => `[**${v.title}**](${config.baseUrl}/votes/${v.id}) (${v.previous} → ${v.next})`)
                    .join(", ")}`,
                "voting",
            );
        }

        this.setSuccessMessage(
            `Recalibrated ${changedVotings.length} votings (${unchangedCount} unchanged)`,
        );
    }
}
