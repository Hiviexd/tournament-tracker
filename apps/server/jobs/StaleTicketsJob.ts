import BaseJob from "./BaseJob";
import Ticket from "../models/ticketModel";
import dayjs from "@tc/utils/dayjs";
import config from "@tc/config";
import { EmbedBuilder } from "../services/discord/EmbedBuilder";
import { WebhookBuilder } from "../services/discord/WebhookBuilder";
import DiscordUtils from "../services/discord/DiscordUtils";
import utils from "@tc/utils/server";
import LogService from "../services/LogService";
import { ITicket } from "@tc/types/Ticket";

export default class StaleTicketsJob extends BaseJob {
    name = "StaleTickets";
    schedule = "0 18 * * *"; // Run at 18:00 UTC every day

    protected async execute(): Promise<void> {
        const activeTickets = await Ticket.find({ isActive: true })
            .populate("messages")
            .populate("author", "username osuId")
            .populate("targetUser", "username osuId");

        const staleTickets: ITicket[] = [];
        const ticketsToUpdate: any[] = [];

        for (const ticket of activeTickets) {
            const now = dayjs();

            // Check if ticket is snoozed
            if (ticket.snoozedUntil) {
                const snoozeExpiration = dayjs(ticket.snoozedUntil);

                // If snooze time has passed, remove the snooze
                if (now.isAfter(snoozeExpiration)) {
                    ticket.snoozedUntil = undefined;
                    ticketsToUpdate.push(ticket);
                    // Continue processing this ticket normally
                } else {
                    // Still snoozed, skip this ticket
                    continue;
                }
            }

            const lastResponse = dayjs(ticket.lastResponseAt);
            const daysSinceLastResponse = now.diff(lastResponse, "days");

            // Skip if less than 7 days old
            if (daysSinceLastResponse < 7) continue;

            // Skip if last non-note message is from committee
            const messages = ticket.messages.filter((message) => !message.isNote);
            const lastMessage = messages[messages.length - 1];
            if (lastMessage.isCommittee) continue;

            const ticketType = ticket.type === "report" ? "Report" : "Ticket";
            const ticketUrl = `${config.baseUrl}/tickets/${ticket._id}`;

            if (daysSinceLastResponse >= 10) {
                // 10+ days - send with ping
                staleTickets.push(ticket);

                // ping the committee members who sent messages in the ticket
                const usersToPing = new Set<string>();

                ticket.messages.forEach((message) => {
                    if (message.author.isCommittee) {
                        usersToPing.add(message.author.discordId || message.author.username);
                    }
                });

                const staleEmbed = new EmbedBuilder()
                    .setColor(DiscordUtils.webhookColors.red)
                    .setDescription(
                        `[**${ticket.title}**](${ticketUrl}) has had no response for ${utils.formatCount(
                            daysSinceLastResponse,
                            "day",
                        )}!`,
                    )
                    .addField("Type", ticketType, true)
                    .addField("Author", `[**${ticket.author.username}**](${ticket.author.osuProfileUrl})`, true)
                    .addField("Last Response", utils.discordTimestamp(ticket.lastResponseAt), false);

                const webhookBuilder = new WebhookBuilder()
                    .addEmbed(staleEmbed)
                    .addUsers(Array.from(usersToPing))
                    .setMessage("Stale Ticket");

                if (ticket.threadId && ticket.threadId.length > 0) {
                    webhookBuilder.setThreadId(ticket.threadId);
                }

                await webhookBuilder.send();
            } else {
                // 7-9 days - send without ping
                staleTickets.push(ticket);

                const staleEmbedNoPing = new EmbedBuilder()
                    .setColor(DiscordUtils.webhookColors.orange)
                    .setDescription(
                        `[**${ticket.title}**](${ticketUrl}) has had no response for ${utils.formatCount(
                            daysSinceLastResponse,
                            "day",
                        )}!`,
                    )
                    .addField("Type", ticketType, true)
                    .addField("Author", ticket.author.username, true)
                    .addField("Last Response", utils.discordTimestamp(ticket.lastResponseAt), false);

                const webhookBuilder = new WebhookBuilder().addEmbed(staleEmbedNoPing);

                if (ticket.threadId && ticket.threadId.length > 0) {
                    webhookBuilder.setThreadId(ticket.threadId);
                }

                await webhookBuilder.send();
            }
        }

        // Update tickets that had their snooze expired
        if (ticketsToUpdate.length > 0) {
            await Promise.all(ticketsToUpdate.map((ticket) => ticket.save()));
        }

        if (staleTickets.length > 0) {
            await LogService.generateSystem(
                `Sent reminders for stale tickets: ${staleTickets
                    .map((t) => `[**${t.title}**](${config.baseUrl}/tickets/${t._id})`)
                    .join(", ")}`,
                "ticket",
            );
        }

        this.setSuccessMessage(`Sent reminders for ${staleTickets.length} stale tickets`);
    }
}
