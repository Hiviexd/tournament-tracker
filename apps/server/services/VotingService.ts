import { IVoting } from "@tc/types/Voting";
import { IVote } from "@tc/types/Vote";
import { IUser, UserGroup } from "@tc/types/User";
import { IDiscordField } from "@tc/types/Discord";
import { BinaryVote, VariableVote, BinaryStrictVote, RankedChoiceVote } from "@tc/types/Vote";
import utils from "@tc/utils/server";
import config from "@tc/config";
import { Document } from "mongoose";
import User from "../models/userModel";
import Voting from "../models/votingModel";
import { EmbedBuilder } from "./discord/EmbedBuilder";
import DiscordUtils from "./discord/DiscordUtils";

const STRICT_PARTICIPATION_PERCENTAGE = 0.75;

export interface RequiredVotesComputation {
    eligibleCount: number;
    validAbstentionCount: number;
    unclamped: number;
    requiredVotes: number;
}

export interface RecalibrateRequiredVotesResult {
    previous: number;
    next: number;
    changed: boolean;
    eligibleCount: number;
}

type AbstainedUserRef = NonNullable<IVoting["abstainedUsers"]>[number] | { _id: { toString(): string } } | string;

type VotingForRequiredVotes = {
    assignedGroups: UserGroup[] | UserGroup;
    forceFullParticipation?: boolean;
    abstainedUsers?: AbstainedUserRef[];
};

type VotingToRecalibrate = VotingForRequiredVotes & {
    requiredVotes: number;
    save(): Promise<{ requiredVotes: number } | void>;
};

export interface RecalibratedVoting {
    voting: Pick<IVoting, "_id" | "title" | "forceFullParticipation">;
    result: RecalibrateRequiredVotesResult;
}

class VotingService {
    public censorVotingForNonCommittee(voting: Document & IVoting) {
        const publicVoting = voting.toObject();
        publicVoting.author = undefined;
        publicVoting.description = "";
        publicVoting.attachments = [];
        publicVoting.abstainedUsers = [];
        publicVoting.votes = publicVoting.votes.map((vote) => ({
            ...vote,
            comment: undefined,
            author: undefined,
        }));
        return publicVoting;
    }

    public async computeRequiredVotes(voting: VotingForRequiredVotes): Promise<RequiredVotesComputation> {
        const assignedGroups = this.normalizeAssignedGroups(voting.assignedGroups);

        const eligibleUsers = await User.find({
            groups: { $in: assignedGroups },
            isActiveVoter: true,
        }).select("_id");

        const eligibleIds = new Set(eligibleUsers.map((user) => user._id.toString()));
        const eligibleCount = eligibleIds.size;
        const base = voting.forceFullParticipation
            ? eligibleCount
            : Math.ceil(STRICT_PARTICIPATION_PERCENTAGE * eligibleCount);

        const validAbstentionCount = (voting.abstainedUsers ?? []).filter((user) =>
            eligibleIds.has(this.getEntityId(user)),
        ).length;

        const unclamped = base - validAbstentionCount;

        return {
            eligibleCount,
            validAbstentionCount,
            unclamped,
            requiredVotes: Math.max(1, unclamped),
        };
    }

    public async recalibrateRequiredVotes(voting: VotingToRecalibrate): Promise<RecalibrateRequiredVotesResult> {
        const previous = voting.requiredVotes;
        const computation = await this.computeRequiredVotes(voting);
        const next = computation.requiredVotes;
        const changed = previous !== next;

        if (changed) {
            voting.requiredVotes = next;
            await voting.save();
        }

        return {
            previous,
            next,
            changed,
            eligibleCount: computation.eligibleCount,
        };
    }

    public async recalibrateActiveVotingsForGroups(groups: UserGroup[] | UserGroup): Promise<RecalibratedVoting[]> {
        const assignedGroups = this.committeeGroups(groups);
        if (assignedGroups.length === 0) return [];

        const votings = await Voting.find({
            isActive: true,
            assignedGroups: { $in: assignedGroups },
        });

        const changed: RecalibratedVoting[] = [];

        for (const voting of votings) {
            const result = await this.recalibrateRequiredVotes(voting);
            if (result.changed) {
                changed.push({ voting, result });
            }
        }

        return changed;
    }

    public isEligibleVoter(
        user: Pick<IUser, "isActiveVoter" | "groups">,
        assignedGroups: UserGroup[] | UserGroup,
    ): boolean {
        return utils.isEligibleVoter(user, this.normalizeAssignedGroups(assignedGroups));
    }

    public buildRecalibrationEmbed(items: RecalibratedVoting[]): EmbedBuilder {
        const header = `Recalibrated required votes for **${utils.formatCount(items.length, "vote")}**`;

        const lines = items.map(({ voting, result }) => {
            const participation = voting.forceFullParticipation ? "100%" : "75%";
            return `- [**${voting.title}**](${config.baseUrl}/votes/${voting._id}): **${result.previous} → ${result.next}** (${result.eligibleCount} eligible, ${participation})`;
        });

        return new EmbedBuilder()
            .setColor(DiscordUtils.webhookColors.lightOrange)
            .setDescription(`${header}\n\n${lines.join("\n")}`);
    }

    private committeeGroups(groups: UserGroup[] | UserGroup): UserGroup[] {
        return [...new Set(this.normalizeAssignedGroups(groups))].filter(
            (group): group is UserGroup => group === "tc" || group === "cc",
        );
    }

    private normalizeAssignedGroups(assignedGroups: UserGroup[] | UserGroup): UserGroup[] {
        return Array.isArray(assignedGroups) ? assignedGroups : [assignedGroups];
    }

    private getEntityId(entity: AbstainedUserRef): string {
        if (utils.isString(entity)) return entity;
        if ("_id" in entity && entity._id) {
            return entity._id.toString();
        }
        return String(entity);
    }

    public generateDiscordVotingResults(voting: IVoting): IDiscordField[] {
        const fields: IDiscordField[] = [];

        switch (voting.type) {
            case "classic": {
                const optionCounts = voting.options.map((option, index) => {
                    const votes = voting.votes.filter(
                        (v) => v.data.type === "classic" && v.data.option === index,
                    ).length;
                    const percentage = voting.votes.length ? Math.round((votes / voting.votes.length) * 100) : 0;
                    return { option, votes, percentage };
                });

                const maxVotes = Math.max(...optionCounts.map((o) => o.votes));
                const winners = optionCounts.filter((o) => o.votes === maxVotes);

                fields.push(
                    {
                        name: "Vote Type",
                        value: `*${voting.type}*`,
                        inline: true,
                    },
                    {
                        name: "Total Votes",
                        value: `${voting.votes.length}`,
                        inline: true,
                    },
                    {
                        name: "Results",
                        value: optionCounts
                            .map((o) => `- **${o.option}** - ${o.percentage}% (${o.votes}/${voting.votes.length})`)
                            .join("\n"),
                    },
                    {
                        name: "Winner(s)",
                        value: winners.map((w) => w.option).join(", "),
                    },
                );
                break;
            }

            case "binary": {
                const scores = voting.votes
                    .filter((v): v is IVote & { data: BinaryVote } => v.data.type === "binary")
                    .map((v) => v.data.score);

                const avgScore = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2) : "N/A";

                fields.push(
                    {
                        name: "Vote Type",
                        value: `*${voting.type}*`,
                        inline: true,
                    },
                    {
                        name: "Total Votes",
                        value: `${voting.votes.length}`,
                        inline: true,
                    },
                    {
                        name: "Results",
                        value:
                            `Average score: **${avgScore}** (${scores.length} votes)\n\n` +
                            `Distribution:\n` +
                            `- ${voting.options[0]} (1 to 5): ${scores.filter((s) => s > 0).length}\n` +
                            `- Neutral (0): ${scores.filter((s) => s === 0).length}\n` +
                            `- ${voting.options[1]} (-5 to -1): ${scores.filter((s) => s < 0).length}`,
                    },
                    {
                        name: "Final Score",
                        value: `Average: ${avgScore}`,
                    },
                );
                break;
            }

            case "variable": {
                const optionScores = voting.options.map((option, index) => {
                    const scores = voting.votes
                        .filter((v): v is IVote & { data: VariableVote } => v.data.type === "variable")
                        .map((v) => v.data.scores.find((s) => s.optionIndex === index)?.score ?? 0);

                    const avgScore = scores.length
                        ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2)
                        : "N/A";

                    return { option, avgScore, votes: scores.length };
                });

                const maxScore = Math.max(...optionScores.map((o) => Number(o.avgScore)));
                const winners = optionScores.filter((o) => Number(o.avgScore) === maxScore);

                fields.push(
                    {
                        name: "Vote Type",
                        value: `*${voting.type}*`,
                        inline: true,
                    },
                    {
                        name: "Total Votes",
                        value: `${voting.votes.length}`,
                        inline: true,
                    },
                    {
                        name: "Results",
                        value: optionScores
                            .map((o) => `- **${o.option}** - Avg: ${o.avgScore} (${o.votes} votes)`)
                            .join("\n"),
                    },
                    {
                        name: "Winner(s)",
                        value: winners.map((w) => w.option).join(", "),
                    },
                );
                break;
            }

            case "binary-strict": {
                const agreeOption = voting.options[0];
                const disagreeOption = voting.allowNeutralVotes ? voting.options[2] : voting.options[1];
                const neutralOption = voting.allowNeutralVotes ? voting.options[1] : null;

                const binaryStrictVotes = voting.votes.filter(
                    (v): v is IVote & { data: BinaryStrictVote } => v.data.type === "binary-strict",
                );

                const distribution = {
                    agree: binaryStrictVotes.filter((v) => v.data.score === 1).length,
                    neutral: binaryStrictVotes.filter((v) => v.data.score === 0).length,
                    disagree: binaryStrictVotes.filter((v) => v.data.score === -1).length,
                };

                // Exclude neutral votes for winner calculation
                const nonNeutralVotes = distribution.agree + distribution.disagree;
                const agreePercentage =
                    nonNeutralVotes > 0 ? Math.round((distribution.agree / nonNeutralVotes) * 100) : 0;
                const disagreePercentage =
                    nonNeutralVotes > 0 ? Math.round((distribution.disagree / nonNeutralVotes) * 100) : 0;
                const neutralPercentage =
                    voting.votes.length > 0 ? Math.round((distribution.neutral / voting.votes.length) * 100) : 0;

                // Determine winner (excluding neutrals)
                let winner = "idk man blame hivie if you see this";
                const passPercentage = voting.binaryStrictPassThreshold || 50;
                if (distribution.agree === distribution.disagree) winner = "🏳️ Tie";
                else if (agreePercentage >= passPercentage) winner = `✅ ${agreeOption}`;
                else winner = `❌ ${disagreeOption}`;

                let resultsText = `**Pass Threshold**: ${passPercentage}%\n\n`;
                resultsText += `**${agreeOption}**: ${agreePercentage}% (${distribution.agree}/${nonNeutralVotes})\n`;
                resultsText += `**${disagreeOption}**: ${disagreePercentage}% (${distribution.disagree}/${nonNeutralVotes})`;

                if (distribution.neutral > 0) {
                    resultsText += `\n**${neutralOption}**: ${neutralPercentage}% (${distribution.neutral}/${voting.votes.length}) *(excluded from result)*`;
                }

                fields.push(
                    {
                        name: "Vote Type",
                        value: `*${voting.type}*`,
                        inline: true,
                    },
                    {
                        name: "Total Votes",
                        value: `${voting.votes.length}`,
                        inline: true,
                    },
                    {
                        name: "Results",
                        value: resultsText,
                    },
                    {
                        name: "Winner",
                        value: winner,
                    },
                );
                break;
            }

            case "ranked-choice": {
                const rankedChoiceVotes = voting.votes.filter(
                    (v): v is IVote & { data: RankedChoiceVote } => v.data.type === "ranked-choice",
                );

                if (rankedChoiceVotes.length === 0) {
                    fields.push(
                        {
                            name: "Vote Type",
                            value: `*${voting.type}*`,
                            inline: true,
                        },
                        {
                            name: "Total Votes",
                            value: `${voting.votes.length}`,
                            inline: true,
                        },
                        {
                            name: "Results",
                            value: "No votes submitted yet.",
                        },
                    );
                } else {
                    // Calculate Schulze ranking
                    const schulzeRanking = utils.calculateSchulzeWinner(
                        rankedChoiceVotes.map((v) => v.data),
                        voting.options.length,
                    );

                    const resultsText = schulzeRanking
                        .map((optionIndex, rank) => {
                            const position = rank + 1;
                            const option = voting.options[optionIndex];
                            return `${position}. **${option}**`;
                        })
                        .join("\n");

                    fields.push(
                        {
                            name: "Vote Type",
                            value: `*${voting.type}*`,
                            inline: true,
                        },
                        {
                            name: "Total Votes",
                            value: `${voting.votes.length}`,
                            inline: true,
                        },
                        {
                            name: "Schulze Method Results",
                            value: resultsText,
                        },
                        {
                            name: "Winner",
                            value: `🏆 **${voting.options[schulzeRanking[0]]}**`,
                        },
                    );
                }
                break;
            }
        }

        return fields;
    }
}

export default new VotingService();
