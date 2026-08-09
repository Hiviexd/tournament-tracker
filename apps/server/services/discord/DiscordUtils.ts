import { IDiscordEmbed, IDiscordAuthor } from "@tc/types/Discord";
import { Session } from "express-session";
import { EmbedBuilder } from "./EmbedBuilder";
import utils from "@tc/utils/server";
import axios from "axios";
import config from "@tc/config";

/**
 * Singleton utility class for Discord webhook operations
 */
export default class DiscordUtils {
    private static getWebhookLink(webhookType: "main" | "dev", threadId?: string): string {
        let url = `https://discord.com/api/webhooks/${config.discord.webhooks[webhookType].id}/${config.discord.webhooks[webhookType].token}`;
        if (threadId && process.env.NODE_ENV !== "development") {
            url += `?thread_id=${threadId}`;
        }
        return url;
    }

    /**
     * Parse hex color string to number
     */
    private static parseColor(color: string): number {
        return parseInt(color.substring(1), 16);
    }

    /**
     * Webhook color constants
     */
    public static readonly webhookColors = {
        darkRed: this.parseColor("#861615"), // deleteVoting
        red: this.parseColor("#EE2629"),
        lightRed: this.parseColor("#FF7373"), // create report
        darkOrange: this.parseColor("#CE5310"),
        orange: this.parseColor("#f57e2a"),
        lightOrange: this.parseColor("#EEA578"),
        darkYellow: this.parseColor("#ffac00"), // toggleVotingStatus
        yellow: this.parseColor("#ffc85a"), // toggleVotingStatus
        lightYellow: this.parseColor("#FFFF55"), // createVoting
        darkGreen: this.parseColor("#22A522"),
        green: this.parseColor("#42D63E"),
        lightGreen: this.parseColor("#1df27d"), // submitVote
        darkBlue: this.parseColor("#304989"), // send ticket message
        blue: this.parseColor("#008cff"), // create ticket
        lightBlue: this.parseColor("#83E3FF"), // add ticket note
        darkPurple: this.parseColor("#721C6F"),
        purple: this.parseColor("#8240A8"),
        lightPurple: this.parseColor("#AA7FF1"),
        darkPink: this.parseColor("#FF40A8"),
        pink: this.parseColor("#FF8ECC"),
        lightPink: this.parseColor("#FFB3C4"),
        white: this.parseColor("#EFEFEF"),
        brown: this.parseColor("#91582A"),
        gray: this.parseColor("#9E9E9E"),
        darkGray: this.parseColor("#424242"),
        black: this.parseColor("#272727"),
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
        threadId?: string,
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
                utils.shorten(`\`\`\`${JSON.stringify(error.response?.data?.message, null, 2)}\`\`\``, 1024),
            )
            .addField("embeds", utils.shorten(`\`\`\`${JSON.stringify(embeds, null, 2)}\`\`\``, 1024))
            .setTimestamp();

        if (webhookAuthor) {
            errorEmbed.setAuthor(webhookAuthor);
        }

        const url = this.getWebhookLink("dev", threadId);
        const content = webhookType ? `Failure source: \`${webhookType}\`` : "";

        try {
            await axios.post(url, {
                username: config.discord.username,
                avatar_url: config.discord.avatar_url,
                embeds: [errorEmbed.build()],
                content,
            });
        } catch (error) {
            // ¯\_(ツ)_/¯
            console.error(error);
        }
    }
}
