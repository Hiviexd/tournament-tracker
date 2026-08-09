import { BadRequestException, HttpException, Injectable } from "@nestjs/common";
import startCase from "lodash/startCase.js";
import type { Session } from "express-session";
import dayjs from "@tc/utils/dayjs";
import { InfringementType, TIME_BASED_TYPES, WatchlistQuery } from "@tc/types/Infringement";
import InfringementService from "../../services/InfringementService";
import LogService from "@tc/models/LogService";
import { EmbedBuilder } from "@tc/notifications/discord/EmbedBuilder";
import { WebhookBuilder } from "@tc/notifications/discord/WebhookBuilder";
import DiscordUtils from "@tc/notifications/discord/DiscordUtils";
import utils from "@tc/utils/server";
import config from "@tc/config";

function rethrowServiceError(err: unknown): never {
    if (err && typeof err === "object" && "status" in err && "error" in err) {
        const e = err as { status: number; error: string };
        throw new HttpException(e.error, e.status);
    }
    throw err;
}

@Injectable()
export class InfringementsService {
    async getWatchlist(queryParams: Record<string, string | undefined>) {
        const query: WatchlistQuery = {
            infringementType: queryParams.infringementType as WatchlistQuery["infringementType"],
            page: queryParams.page ? parseInt(queryParams.page, 10) : undefined,
            limit: queryParams.limit ? parseInt(queryParams.limit, 10) : undefined,
        };
        return await InfringementService.getWatchlist(query);
    }

    async addInfringement(
        body: {
            userIds?: string | string[];
            type: InfringementType;
            startDate?: string | Date;
            endDate?: string | Date;
            reason: string;
            threadId?: string;
            enchantUrl?: string;
        },
        session: Session,
    ) {
        const { userIds, type, startDate, endDate, reason, threadId, enchantUrl } = body;

        try {
            const normalizedUserIds = Array.isArray(userIds) ? userIds : [userIds];
            const validUserIds = normalizedUserIds.filter(
                (id): id is string => typeof id === "string" && id.trim() !== "",
            );

            if (validUserIds.length === 0) {
                throw new BadRequestException("At least one user ID is required");
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
                    session.mongoId!,
                    `Added **${startCase(type)}** infringement to [**${result.user.username}**](${config.baseUrl}/watchlist?user=${result.user.osuId})`,
                    "user",
                );
            }

            const response =
                addedInfringements.length === 1
                    ? { message: "Infringement added successfully!", user: addedInfringements[0].user }
                    : {
                          message: `Infringements added successfully for ${addedInfringements.length} users!`,
                          users: addedInfringements.map((item) => item.user),
                      };

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
                .setAuthor(DiscordUtils.defaultWebhookAuthor(session))
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

            return response;
        } catch (err) {
            if (err instanceof HttpException) throw err;
            rethrowServiceError(err);
        }
    }

    async updateInfringement(
        infringementId: string,
        body: {
            userId: string;
            startDate?: string | Date;
            endDate?: string | Date;
            reason?: string;
            threadId?: string;
            enchantUrl?: string;
        },
        session: Session,
    ) {
        const { userId, startDate, endDate, reason, threadId, enchantUrl } = body;

        try {
            const { infringement, user } = await InfringementService.updateInfringement(infringementId, userId, {
                startDate,
                endDate,
                reason,
                threadId,
                enchantUrl,
            });

            await LogService.generate(
                session.mongoId!,
                `Updated **${infringement.typeString}** infringement of [**${user.username}**](${config.baseUrl}/watchlist?user=${user.osuId})`,
                "user",
            );

            return { message: "Infringement updated successfully!", user };
        } catch (err) {
            rethrowServiceError(err);
        }
    }
}
