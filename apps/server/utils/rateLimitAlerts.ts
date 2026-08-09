import { EmbedBuilder } from "../services/discord/EmbedBuilder";
import { WebhookBuilder } from "../services/discord/WebhookBuilder";
import DiscordUtils from "../services/discord/DiscordUtils";

export type RateLimitAlert = {
    type: "session" | "apiKey";
    ip: string;
    path: string;
    method: string;
    identifier?: string; // mongoId for session or masked api key
    osuId?: string; // optional osu id
    username?: string; // optional username
    timestamp: number;
};

// In-memory, process-local queue
const rateLimitAlertQueue: RateLimitAlert[] = [];

const MAX_QUEUE_SIZE = 500;
const FLUSH_INTERVAL_MS = 30_000; // send at most once every 30 seconds
const DISCORD_USER_ID = "341321481390784512"; // Hivie

export function enqueueRateLimitAlert(alert: Omit<RateLimitAlert, "timestamp">) {
    if (rateLimitAlertQueue.length >= MAX_QUEUE_SIZE) {
        rateLimitAlertQueue.shift();
    }
    rateLimitAlertQueue.push({ ...alert, timestamp: Date.now() });
}

function consumeRateLimitAlerts(): RateLimitAlert[] {
    if (!rateLimitAlertQueue.length) return [];
    return rateLimitAlertQueue.splice(0, rateLimitAlertQueue.length);
}

let isFlushing = false;

async function flushRateLimitAlerts() {
    if (isFlushing) return;
    const batch = consumeRateLimitAlerts();
    if (!batch.length) return;
    isFlushing = true;
    try {
        const total = batch.length;
        const sessionAlerts = batch.filter((b) => b.type === "session");
        const apiKeyAlerts = batch.filter((b) => b.type === "apiKey");

        // Aggregate by path, split by type
        const countPaths = (items: RateLimitAlert[]) => {
            const map = new Map<string, number>();
            for (const item of items) {
                const key = `\`${item.method}\` \`${item.path}\``;
                map.set(key, (map.get(key) || 0) + 1);
            }
            return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
        };

        const topSessionPaths = countPaths(sessionAlerts)
            .map(([k, v]) => `- ${k} — \`${v}\``)
            .join("\n");
        const topApiKeyPaths = countPaths(apiKeyAlerts)
            .map(([k, v]) => `- ${k} — \`${v}\``)
            .join("\n");

        // Aggregate by user+IP (prefer osuId + username)
        const userCounts = (items: RateLimitAlert[]) => {
            type Entry = { key: string; display: string; ip: string; count: number };
            const map = new Map<string, Entry>();
            for (const i of items) {
                const osuId = i.osuId || "unknown";
                const username = i.username || "unknown";
                const ipDisplay = i.ip || "unknown";
                const key = `osu:${osuId}|ip:${ipDisplay}`; // stable key per user+ip
                const display =
                    i.osuId && i.username
                        ? `[**${username}**](https://osu.ppy.sh/users/${osuId})`
                        : username !== "unknown"
                          ? username
                          : "unknown";
                const existing = map.get(key);
                if (existing) existing.count += 1;
                else map.set(key, { key, display, ip: ipDisplay, count: 1 });
            }
            return [...map.values()].sort((a, b) => b.count - a.count).slice(0, 5);
        };

        const topSessionUsers = userCounts(sessionAlerts)
            .map((e) => `- ${e.display} — \`${e.ip}\` — \`${e.count}\``)
            .join("\n");
        const topApiKeyUsers = userCounts(apiKeyAlerts)
            .map((e) => `- ${e.display} — \`${e.ip}\` — \`${e.count}\``)
            .join("\n");

        const fields: Array<{ name: string; value: string; inline?: boolean }> = [
            { name: "Total", value: String(total), inline: true },
            { name: "Session", value: String(sessionAlerts.length), inline: true },
            { name: "API Key", value: String(apiKeyAlerts.length), inline: true },
        ];

        if (topSessionPaths) fields.push({ name: "Top session endpoints", value: topSessionPaths });
        if (topApiKeyPaths) fields.push({ name: "Top API key endpoints", value: topApiKeyPaths });
        if (topSessionUsers) fields.push({ name: "Top session users", value: topSessionUsers });
        if (topApiKeyUsers) fields.push({ name: "Top API key users", value: topApiKeyUsers });

        const embed = new EmbedBuilder()
            .setColor(DiscordUtils.webhookColors.orange)
            .setTitle("⚠️ Rate limit alerts")
            .setTimestamp();

        for (const field of fields) {
            embed.addField(field.name, field.value, field.inline);
        }

        await new WebhookBuilder()
            .addEmbed(embed)
            .addUsers([DISCORD_USER_ID])
            .setMessage("Rate limit alerts")
            .setLocation("dev")
            .send();
    } catch {
        // Ignore errors to avoid crashing background flusher
        console.error("Error flushing rate limit alerts");
    } finally {
        isFlushing = false;
    }
}

// Ensure a single interval even with hot reloads
declare global {
    // eslint-disable-next-line no-var
    var __rateLimitAlertsInterval: NodeJS.Timeout | undefined;
}

if (!global.__rateLimitAlertsInterval) {
    global.__rateLimitAlertsInterval = setInterval(() => {
        void flushRateLimitAlerts();
    }, FLUSH_INTERVAL_MS);
}
