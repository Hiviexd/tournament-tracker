import BaseJob from "./BaseJob";
import Voting from "../models/votingModel";
import dayjs from "@tc/utils/dayjs";
import config from "@tc/config";
import { EmbedBuilder } from "../services/discord/EmbedBuilder";
import { WebhookBuilder } from "../services/discord/WebhookBuilder";
import DiscordUtils from "../services/discord/DiscordUtils";
import VotingService from "../services/VotingService";
import LogService from "../services/LogService";

export default class ConcludableVotingsJob extends BaseJob {
    name = "ConcludableVotings";
    schedule = "0,30 * * * *"; // Run every 30 minutes

    protected async execute(): Promise<void> {
        const now = dayjs();
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
            const fields = VotingService.generateDiscordVotingResults(voting);

            const concludedEmbed = new EmbedBuilder()
                .setColor(DiscordUtils.webhookColors.darkYellow)
                .setDescription(
                    `[**${voting.title}**](${config.baseUrl}/votes/${voting._id}) vote has been automatically concluded!`,
                );

            for (const field of fields) {
                concludedEmbed.addField(field.name, field.value, field.inline);
            }

            await new WebhookBuilder().addEmbed(concludedEmbed).send();

            await LogService.generateSystem(
                `Automatically concluded vote [**${voting.title}**](${config.baseUrl}/votes/${voting._id})`,
                "voting",
            );
        }

        this.setSuccessMessage(`Automatically concluded ${concludableVotings.length} votings`);
    }
}
