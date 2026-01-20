import BaseJob from "./BaseJob";
import User from "../models/userModel";
import config from "../../config.json";
import { EmbedBuilder } from "../services/discord/EmbedBuilder";
import { WebhookBuilder } from "../services/discord/WebhookBuilder";
import DiscordUtils from "../services/discord/DiscordUtils";
import utils from "../../utils";
import LogService from "../services/LogService";
import { IUser } from "../../interfaces/User";

export default class BadgeUpdatesJob extends BaseJob {
    name = "BadgeUpdates";
    schedule = "0 12 * * *"; // Run at 12:00 UTC every day

    protected async execute(): Promise<void> {
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

            const badgeEmbed = new EmbedBuilder()
                .setColor(DiscordUtils.webhookColors.orange)
                .setDescription(
                    `[**${user.username}**](${config.baseUrl}/users?id=${user.osuId}) needs a badge update!`
                )
                .addField("Current Badge", user.badgeValue.toString(), true)
                .addField("Eligible Years", years.toString(), true)
                .addField("Team", committee.toUpperCase(), true)
                .addField("Command", `\`\`\`${commandString}\`\`\``, false);

            await new WebhookBuilder().addEmbed(badgeEmbed).addUsers(usersToPing).send();
        }

        if (badgeUpdates.length > 0) {
            await LogService.generateSystem(
                `Sent badge update requests for users: ${badgeUpdates
                    .map((u) => `[**${u.username}**](${config.baseUrl}/users?id=${u.osuId})`)
                    .join(", ")}`,
                "user"
            );
        }

        this.setSuccessMessage(`Sent badge update requests for ${badgeUpdates.length} users`);
    }
}
