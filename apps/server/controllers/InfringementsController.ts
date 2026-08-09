import { Request, Response } from "express";
import startCase from "lodash/startCase.js";
import dayjs from "@tc/utils/dayjs";
import { InfringementType, TIME_BASED_TYPES, WatchlistQuery } from "@tc/types/Infringement";
import InfringementService from "../services/InfringementService";
import LogService from "../services/LogService";
import { EmbedBuilder } from "@tc/notifications/discord/EmbedBuilder";
import { WebhookBuilder } from "@tc/notifications/discord/WebhookBuilder";
import DiscordUtils from "@tc/notifications/discord/DiscordUtils";
import utils from "@tc/utils/server";
import config from "@tc/config";

class InfringementsController {
    /** GET watchlist */
    public async getWatchlist(req: Request, res: Response) {
        const reqQuery = req.query as Record<string, string | undefined>;
        const query: WatchlistQuery = {
            infringementType: reqQuery.infringementType as WatchlistQuery["infringementType"],
            page: reqQuery.page ? parseInt(reqQuery.page, 10) : undefined,
            limit: reqQuery.limit ? parseInt(reqQuery.limit, 10) : undefined,
        };
        const result = await InfringementService.getWatchlist(query);
        res.json(result);
    }

    /** POST add infringement */
    public async addInfringement(req: Request, res: Response) {
        const { userIds, type, startDate, endDate, reason, threadId, enchantUrl } = req.body;

        try {
            const normalizedUserIds = Array.isArray(userIds) ? userIds : [userIds];
            const validUserIds = normalizedUserIds.filter(
                (id): id is string => typeof id === "string" && id.trim() !== "",
            );

            if (validUserIds.length === 0) {
                return res.status(400).json({ error: "At least one user ID is required" });
            }

            const addedInfringements: { infringement: any; user: any }[] = [];

            for (const userId of validUserIds) {
                const result = await InfringementService.addInfringement(userId, {
                    type,
                    startDate,
                    endDate,
                    reason,
                    threadId,
                    enchantUrl,
                });
                addedInfringements.push(result);

                await LogService.generate(
                    req.session.mongoId!,
                    `Added **${startCase(type)}** infringement to [**${result.user.username}**](${config.baseUrl}/watchlist?user=${result.user.osuId})`,
                    "user",
                );
            }

            if (addedInfringements.length === 1) {
                res.json({ message: "Infringement added successfully!", user: addedInfringements[0].user });
            } else {
                res.json({
                    message: `Infringements added successfully for ${addedInfringements.length} users!`,
                    users: addedInfringements.map((item) => item.user),
                });
            }

            const isTimeBased = TIME_BASED_TYPES.includes(type);
            const firstResult = addedInfringements[0];
            const firstInfringement = firstResult.infringement;
            const firstUser = firstResult.user;

            const typeColorMap: { [key in InfringementType]: number } = {
                [InfringementType.NOTE]: DiscordUtils.webhookColors.lightBlue,
                [InfringementType.WARNING]: DiscordUtils.webhookColors.yellow,
                [InfringementType.TOURNAMENT_BAN]: DiscordUtils.webhookColors.red,
                [InfringementType.HOSTING_BAN]: DiscordUtils.webhookColors.red,
                [InfringementType.STAFFING_BAN]: DiscordUtils.webhookColors.red,
            };

            const isIndefinite = isTimeBased && !endDate;

            const embed = new EmbedBuilder()
                .setAuthor(DiscordUtils.defaultWebhookAuthor(req.session))
                .setColor(isIndefinite ? DiscordUtils.webhookColors.darkRed : typeColorMap[type])
                .setDescription(
                    addedInfringements.length === 1
                        ? `Added **${startCase(type)}** to [**${firstUser.username}**](${config.baseUrl}/watchlist?user=${firstUser.osuId})`
                        : `Added **${startCase(type)}** infringements to **${addedInfringements.length} users**.`,
                );

            if (addedInfringements.length === 1) {
                embed.setFooter(`ID: ${firstInfringement.id}`);
            } else {
                const usersList = addedInfringements
                    .map((item) => `[**${item.user.username}**](${config.baseUrl}/watchlist?user=${item.user.osuId})`)
                    .join(", ");
                embed.addField("Users", utils.shorten(usersList, 1024));
            }

            if (isTimeBased) {
                if (startDate && endDate) {
                    const humanizedDuration = dayjs.duration(dayjs(endDate).diff(dayjs(startDate))).humanize();
                    embed.addField(
                        "Duration",
                        `${dayjs(startDate).format("MMM D, YYYY")} – ${dayjs(endDate).format(
                            "MMM D, YYYY",
                        )} (${humanizedDuration})`,
                    );
                } else if (startDate) {
                    embed.addField("Duration", "Indefinite");
                }
            }

            embed.addField("Reason", utils.shorten(reason, 1024));

            const webhookBuilder = new WebhookBuilder().addEmbed(embed);

            if (firstInfringement.threadId) {
                webhookBuilder.setThreadId(firstInfringement.threadId);
            }

            await webhookBuilder.send();
        } catch (err: any) {
            if (err.status) {
                return res.status(err.status).json({ error: err.error });
            }
            throw err;
        }
    }

    /** PATCH update infringement */
    public async updateInfringement(req: Request, res: Response) {
        const { infringementId } = req.params;
        const { userId, startDate, endDate, reason, threadId, enchantUrl } = req.body;

        try {
            const { infringement, user } = await InfringementService.updateInfringement(infringementId, userId, {
                startDate,
                endDate,
                reason,
                threadId,
                enchantUrl,
            });

            res.json({ message: "Infringement updated successfully!", user });

            await LogService.generate(
                req.session.mongoId!,
                `Updated **${infringement.typeString}** infringement of [**${user.username}**](${config.baseUrl}/watchlist?user=${user.osuId})`,
                "user",
            );
        } catch (err: any) {
            if (err.status) {
                return res.status(err.status).json({ error: err.error });
            }
            throw err;
        }
    }
}

export default new InfringementsController();
