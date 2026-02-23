import { Request, Response } from "express";
import _ from "lodash";
import moment from "moment";
import { InfringementType, TIME_BASED_TYPES, WatchlistQuery } from "../../interfaces/Infringement";
import InfringementService from "../services/InfringementService";
import LogService from "../services/LogService";
import { EmbedBuilder } from "../services/discord/EmbedBuilder";
import { WebhookBuilder } from "../services/discord/WebhookBuilder";
import DiscordUtils from "../services/discord/DiscordUtils";
import utils from "../../utils";
import config from "../../config.json";

class InfringementsController {
    /** GET watchlist */
    public async getWatchlist(req: Request, res: Response) {
        const query = req.query as WatchlistQuery;
        const users = await InfringementService.getWatchlist(query);
        res.json(users);
    }

    /** POST add infringement */
    public async addInfringement(req: Request, res: Response) {
        const { userId } = req.params;
        const { type, startDate, endDate, reason, threadId, enchantUrl } = req.body;

        try {
            const { infringement, user } = await InfringementService.addInfringement(userId, {
                type,
                startDate,
                endDate,
                reason,
                threadId,
                enchantUrl,
            });

            res.json({ message: "Infringement added successfully!", user });

            await LogService.generate(
                req.session.mongoId!,
                `Added **${_.startCase(type)}** infringement to [**${user.username}**](${config.baseUrl}/watchlist?user=${user.osuId})`,
                "user"
            );

            const isTimeBased = TIME_BASED_TYPES.includes(type);

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
                    `Added **${_.startCase(type)}** to [**${user.username}**](${config.baseUrl}/watchlist?user=${user.osuId})`
                )
                .setFooter(`ID: ${infringement.id}`);

            if (isTimeBased) {
                if (startDate && endDate) {
                    const humanizedDuration = moment.duration(moment(endDate).diff(moment(startDate))).humanize();
                    embed.addField(
                        "Duration",
                        `${moment(startDate).format("MMM D, YYYY")} — ${moment(endDate).format(
                            "MMM D, YYYY"
                        )} (${humanizedDuration})`
                    );
                } else if (startDate) {
                    embed.addField("Duration", "Indefinite");
                }
            }

            embed.addField("Reason", utils.shorten(reason, 1024));

            await new WebhookBuilder().addEmbed(embed).send();
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
                "user"
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
