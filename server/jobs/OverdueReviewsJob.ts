import BaseJob from "./BaseJob";
import Tournament from "../models/tournamentModel";
import dayjs from "../../utils/dayjs";
import config from "../../config.json";
import { EmbedBuilder } from "../services/discord/EmbedBuilder";
import { WebhookBuilder } from "../services/discord/WebhookBuilder";
import DiscordUtils from "../services/discord/DiscordUtils";
import utils from "../../utils/server";
import User from "../models/userModel";
import LogService from "../services/LogService";
import { ITournament } from "../../interfaces/Tournament";
import { IUser } from "../../interfaces/User";

export default class OverdueReviewsJob extends BaseJob {
    name = "OverdueReviews";
    schedule = "0 16 * * *"; // Run at 16:00 UTC every day

    protected async execute(): Promise<void> {
        // Get all active tournaments with reviewOngoing status
        const activeTournaments = await Tournament.find({
            isActive: true,
            status: "reviewOngoing",
            startedReviewAt: { $exists: true },
        }).populate([
            {
                path: "assignedReviewers",
                select: "username osuId discordId isActiveReviewer",
            },
            {
                path: "reviews",
                select: "author",
                populate: {
                    path: "author",
                    select: "username osuId",
                },
            },
        ]);

        const overdueReviews: Array<{
            tournament: ITournament;
            daysSinceReview: number;
            missingReviewers: IUser[];
        }> = [];

        for (const tournament of activeTournaments) {
            // Skip if no startedReviewAt date
            if (!tournament.startedReviewAt) continue;

            const reviewStartDate = dayjs(tournament.startedReviewAt);
            const now = dayjs();
            const daysSinceReview = now.diff(reviewStartDate, "days");

            // Skip if less than 7 days old
            if (daysSinceReview < 7) continue;

            // Skip if no assigned reviewers
            if (!tournament.assignedReviewers?.length) continue;

            // Get set of user IDs who have already reviewed
            const reviewedUserIds = new Set(tournament.reviews?.map((review) => review.author?._id.toString()) || []);

            // Filter out users who have already reviewed
            const missingReviewers = tournament.assignedReviewers.filter(
                (reviewer) => !reviewedUserIds.has(reviewer._id.toString())
            );

            // Filter out inactive reviewers
            const missingReviewersExcludingInactive = missingReviewers.filter((reviewer) => reviewer.isActiveReviewer);

            if (missingReviewers.length === 0) continue;

            // Get Discord IDs for pinging only active reviewers (fall back to username if no Discord ID)
            const usersToPing = missingReviewersExcludingInactive.map((user) => user.discordId || user.username);

            // Determine notification color based on days overdue
            let color = DiscordUtils.webhookColors.lightOrange;
            if (daysSinceReview >= 18) color = DiscordUtils.webhookColors.darkRed;
            else if (daysSinceReview >= 15) color = DiscordUtils.webhookColors.red;
            else if (daysSinceReview >= 12) color = DiscordUtils.webhookColors.lightRed;

            // Only send notifications on specific days or if 18+ days old
            if (
                daysSinceReview === 7 ||
                daysSinceReview === 12 ||
                daysSinceReview === 15 ||
                daysSinceReview === 17 ||
                daysSinceReview >= 18
            ) {
                overdueReviews.push({ tournament, daysSinceReview, missingReviewers });

                // Ping a random non-assigned, active committee member for visibility
                const targetGroup = tournament.type === "tournament" ? "tc" : "cc";
                let thirdUser: IUser | null = null;

                const [randomUser]: IUser[] = await User.aggregate([
                    {
                        $match: {
                            groups: targetGroup,
                            isActiveReviewer: true,
                            _id: { $nin: tournament.assignedReviewers },
                        },
                    },
                    { $sample: { size: 1 } }, // get 1 random user
                ]);

                thirdUser = randomUser ?? null;

                if (thirdUser) {
                    usersToPing.push(thirdUser.discordId || thirdUser.username);
                }

                const reviewEmbed = new EmbedBuilder()
                    .setColor(color)
                    .setDescription(
                        `Review for ${tournament.type} [**${tournament.name}**](${config.baseUrl}/tournaments/${
                            tournament._id
                        }) has been ongoing for ${utils.formatCount(daysSinceReview, "day")}!`
                    )
                    .addField(
                        "Missing Reviews",
                        missingReviewers
                            .map(
                                (reviewer) =>
                                    `[**${reviewer.username}**](${reviewer.osuProfileUrl})${
                                        reviewer.isActiveReviewer ? "" : " *(inactive)*"
                                    }`
                            )
                            .join(", ")
                    )
                    .addField(
                        "Review Started",
                        `${utils.discordTimestamp(tournament.startedReviewAt)} (${utils.discordTimestamp(
                            tournament.startedReviewAt,
                            "dateTime"
                        )})`
                    )
                    .addField(
                        "Note",
                        `A random committee member (<@${
                            thirdUser?.discordId || thirdUser?.username
                        }>) has been added to the thread for visibility.`
                    );

                const webhookBuilder = new WebhookBuilder()
                    .addEmbed(reviewEmbed)
                    .addUsers(usersToPing)
                    .setMessage("Overdue Tournament Review");

                if (tournament.threadId && tournament.threadId.length > 0) {
                    webhookBuilder.setThreadId(tournament.threadId);
                }

                await webhookBuilder.send();
            }
        }

        if (overdueReviews.length > 0) {
            await LogService.generateSystem(
                `Sent reminders for overdue reviews: ${overdueReviews
                    .map(
                        ({ tournament }) => `[**${tournament.name}**](${config.baseUrl}/tournaments/${tournament._id})`
                    )
                    .join(", ")}`,
                "tournament"
            );
        }

        this.setSuccessMessage(`Sent reminders for ${overdueReviews.length} overdue reviews`);
    }
}
