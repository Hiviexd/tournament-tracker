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
        darkRed: this.parseColor("#861615"), // deleteVoting, revokeApiKey, indefiniteInfringement, overdueReview(18d+)
        red: this.parseColor("#EE2629"), // embedError, overdueVote, staleTicket(10d+), bans, overdueReview(15d+), removeReviewer, clearVotes
        lightRed: this.parseColor("#FF7373"), // createReport, badgeRejected, denyReview, dueSoonVote, overdueReview(12d+), removeUserFromGroup
        darkOrange: this.parseColor("#CE5310"), // unused
        orange: this.parseColor("#f57e2a"), // rateLimitAlert, staleTicket(7-9d), badgeUpdate, updateReportTarget, assign/addReviewer, tournamentStatus(default), toggleReviewerActivity, updateBadgeLevel
        lightOrange: this.parseColor("#EEA578"), // overdueReview(<12d), reassignReviewer, toggleVoterActivity
        darkYellow: this.parseColor("#ffac00"), // concludeVoting, autoConcludeVoting
        yellow: this.parseColor("#ffc85a"), // resumeVoting, changesRequested(status/review), warningInfringement, failedBadgeNote
        lightYellow: this.parseColor("#FFFF55"), // createVoting
        darkGreen: this.parseColor("#22A522"), // unused
        green: this.parseColor("#42D63E"), // createTournament
        lightGreen: this.parseColor("#1df27d"), // submitVote(disabled), activeVoteReminder, badgeApproved, approveReview, addUserToGroup
        darkBlue: this.parseColor("#304989"), // sendTicketMessage
        blue: this.parseColor("#008cff"), // createTicket, updateApiKeyScopes, screeningConcluded, createTournamentNote, createUser
        lightBlue: this.parseColor("#83E3FF"), // addTicketNote, noteInfringement, reviewVote(neutral)
        darkPurple: this.parseColor("#721C6F"), // makeVotingPrivate
        purple: this.parseColor("#8240A8"), // snoozeTicketReminders
        lightPurple: this.parseColor("#AA7FF1"), // makeVotingPublic, supportRequestReceived
        darkPink: this.parseColor("#FF40A8"), // onHold
        pink: this.parseColor("#FF8ECC"), // unused
        lightPink: this.parseColor("#FFB3C4"), // unused
        white: this.parseColor("#EFEFEF"), // createApiKey, updateWebhookLocation(ticket/tournament), removeAbstention
        brown: this.parseColor("#91582A"), // unused
        gray: this.parseColor("#9E9E9E"), // reopenTicket, noBadgeRequested, unarchiveTournament
        darkGray: this.parseColor("#424242"), // abstainFromVote
        black: this.parseColor("#272727"), // closeTicket, archiveTournament
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
