import { IDiscordEmbed, IDiscordAuthor } from "../../../interfaces/Discord";
import { Session } from "express-session";
import { EmbedBuilder } from "./EmbedBuilder";
import { WebhookBuilder } from "./WebhookBuilder";
import utils from "../../../utils";

/**
 * Singleton utility class for Discord webhook operations
 */
export default class DiscordUtils {
    /**
     * Parse hex color string to number
     */
    private static parseColor(color: string): number {
        return parseInt(color.substring(1), 16);
    }

    /**
     * Webhook color constants
     */
    /* eslint-disable key-spacing */
    public static readonly webhookColors = {
        darkRed    : this.parseColor("#861615"),   // deleteVoting
        red        : this.parseColor("#EE2629"),
        lightRed   : this.parseColor("#FF7373"),   // create report
        darkOrange : this.parseColor("#CE5310"),
        orange     : this.parseColor("#f57e2a"),
        lightOrange: this.parseColor("#EEA578"),
        darkYellow : this.parseColor("#ffac00"),   // toggleVotingStatus
        yellow     : this.parseColor("#ffc85a"),   // toggleVotingStatus
        lightYellow: this.parseColor("#FFFF55"),   // createVoting
        darkGreen  : this.parseColor("#22A522"),
        green      : this.parseColor("#42D63E"),
        lightGreen : this.parseColor("#1df27d"),   // submitVote
        darkBlue   : this.parseColor("#304989"),   // send ticket message
        blue       : this.parseColor("#008cff"),   // create ticket
        lightBlue  : this.parseColor("#83E3FF"),   // add ticket note
        darkPurple : this.parseColor("#721C6F"),
        purple     : this.parseColor("#8240A8"),
        lightPurple: this.parseColor("#AA7FF1"),
        darkPink   : this.parseColor("#FF40A8"),
        pink       : this.parseColor("#FF8ECC"),
        lightPink  : this.parseColor("#FFB3C4"),
        white      : this.parseColor("#EFEFEF"),
        brown      : this.parseColor("#91582A"),
        gray       : this.parseColor("#9E9E9E"),
        darkGray   : this.parseColor("#424242"),
        black      : this.parseColor("#272727"),
    };

    /**
     * Constructs a webhook author from the current user session
     */
    public static defaultWebhookAuthor(session: Session): IDiscordAuthor {
        return {
            name: session.username ?? "Unknown",
            icon_url: `https://a.ppy.sh/${session.osuId}`,
            url: `https://osu.ppy.sh/users/${session.osuId}`,
        };
    }

    /**
     * Send error webhook to dev channel using builder pattern
     */
    public static async sendErrorWebhook(
        error: any,
        embedInfo: { message?: string; embeds: IDiscordEmbed[] },
        webhookType?: string,
        threadId?: string
    ): Promise<void> {
        const { message, embeds } = embedInfo;

        let webhookAuthor: IDiscordAuthor | undefined;

        // get webhook author from the first embed that has an author
        for (const embed of embeds) {
            if (embed.author) {
                webhookAuthor = embed.author;
                break;
            }
        }

        const errorEmbed = new EmbedBuilder()
            .setColor(DiscordUtils.webhookColors.red)
            .setTitle("❌ Embed error")
            .setDescription("```" + utils.shorten(error.stack || String(error), 2000) + "```")
            .addField("webhook", `\`${webhookType || "main"}\``)
            .addField("thread", `\`${threadId || "none"}\``)
            .addField("message", utils.shorten(`\`\`\`${message || ""}\`\`\``, 1024))
            .addField("code", utils.shorten(`\`\`\`${error.code || "N/A"}\`\`\``, 1024))
            .addField(
                "data",
                utils.shorten(`\`\`\`${JSON.stringify(error.response?.data?.message, null, 2)}\`\`\``, 1024)
            )
            .addField("embeds", utils.shorten(`\`\`\`${JSON.stringify(embeds, null, 2)}\`\`\``, 1024))
            .setTimestamp();

        if (webhookAuthor) {
            errorEmbed.setAuthor(webhookAuthor);
        }

        try {
            await new WebhookBuilder().addEmbed(errorEmbed).setLocation("dev").send();
        } catch (error) {
            // ¯\_(ツ)_/¯
            console.error(error);
        }
    }
}
