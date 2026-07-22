import crypto from "crypto";
import config from "../../config.json";
import { IInfringement } from "../../interfaces/Infringement";
import { ITournament } from "../../interfaces/Tournament";
import { IUser } from "../../interfaces/User";
import utils from "../../utils/server";
import Infringement from "../models/infringementModel";
import Tournament from "../models/tournamentModel";

const RESULT_CAP = 5;

export default class EnchantSidebarService {
    /**
     * Verifies the Enchant-Signature HMAC against the raw request body.
     */
    public static verifySignature(rawBody: Buffer | undefined, signature: string | undefined): boolean {
        const secret = config.enchant?.sidebarSecret;
        if (!secret || !rawBody || !signature) return false;

        const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
        const expectedBuf = Buffer.from(expected, "utf8");
        const actualBuf = Buffer.from(signature, "utf8");

        if (expectedBuf.length !== actualBuf.length) return false;
        return crypto.timingSafeEqual(expectedBuf, actualBuf);
    }

    /**
     * Looks up tournaments and watchlist infringements for an Enchant ticket id
     * and returns sidebar HTML, or an empty string when nothing matches.
     */
    public static async buildSidebarHtml(ticketId: string): Promise<string> {
        if (!ticketId) return "";

        const enchantUrl = utils.buildEnchantTicketUrl(ticketId);

        const [tournaments, infringements] = await Promise.all([
            Tournament.find({ enchantUrl }).populate("hosts").limit(RESULT_CAP),
            Infringement.find({ enchantUrl }).sort({ createdAt: -1 }).limit(RESULT_CAP).populate("userId"),
        ]);

        if (tournaments.length === 0 && infringements.length === 0) return "";

        const sections: string[] = [];

        if (tournaments.length > 0) {
            sections.push(tournaments.map((t) => this.renderTournament(t)).join("<hr>"));
        }

        if (infringements.length > 0) {
            const watchlistHtml = infringements.map((inf) => this.renderInfringement(inf)).join("<hr>");
            sections.push(`<div><p><b>Watchlist</b></p>${watchlistHtml}</div>`);
        }

        return sections.join("<hr>");
    }

    private static renderTournament(tournament: ITournament): string {
        const name = utils.escapeHtml(tournament.name);
        const tournamentUrl = `${config.baseUrl}/tournaments/${tournament._id}`;
        const rows: string[] = [
            `<p><b>Tournament</b></p>`,
            `<p><a href="${tournamentUrl}">${name}</a></p>`,
        ];

        const hosts = (tournament.hosts || [])
            .filter((host): host is IUser => !!host && typeof host === "object" && "osuId" in host)
            .map((host) => {
                const username = utils.escapeHtml(host.username);
                return `<a href="https://osu.ppy.sh/users/${host.osuId}">${username}</a>`;
            });

        if (hosts.length > 0) {
            rows.push(`<p>Hosts: ${hosts.join(", ")}</p>`);
        }

        if (tournament.statusString) {
            rows.push(`<p>Status: ${utils.escapeHtml(tournament.statusString)}</p>`);
        }

        if (tournament.forumUrl && /^https?:\/\//i.test(tournament.forumUrl)) {
            const forumUrl = utils.escapeHtml(tournament.forumUrl);
            rows.push(`<p>Forum: <a href="${forumUrl}">Forum post</a></p>`);
        }

        if (tournament.threadId) {
            const discordUrl = this.buildDiscordThreadUrl(tournament.threadId);
            rows.push(`<p>Discord: <a href="${discordUrl}">Thread</a></p>`);
        }

        return `<div>${rows.join("")}</div>`;
    }

    private static renderInfringement(infringement: IInfringement): string {
        const user = infringement.userId as unknown as IUser | undefined;
        const rows: string[] = [];

        if (user?.osuId && user.username) {
            const username = utils.escapeHtml(user.username);
            const watchlistUrl = `${config.baseUrl}/watchlist?user=${user.osuId}`;
            rows.push(`<p>User: <a href="${watchlistUrl}">${username}</a></p>`);
        }

        if (infringement.typeString) {
            rows.push(`<p>Type: ${utils.escapeHtml(infringement.typeString)}</p>`);
        }

        if (infringement.reason) {
            rows.push(`<p>Reason: ${utils.escapeHtml(infringement.reason)}</p>`);
        }

        if (infringement.threadId) {
            const discordUrl = this.buildDiscordThreadUrl(infringement.threadId);
            rows.push(`<p>Discord: <a href="${discordUrl}">Thread</a></p>`);
        }

        return `<div>${rows.join("")}</div>`;
    }

    private static buildDiscordThreadUrl(threadId: string): string {
        const serverId = config.discord.webhooks.main.serverId;
        return `https://discord.com/channels/${serverId}/${threadId}`;
    }
}
