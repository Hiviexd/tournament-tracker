import { IVoting } from "@tc/types/Voting";
import { IVote } from "@tc/types/Vote";
import { IDiscordField } from "@tc/types/Discord";
import { BinaryVote, VariableVote, BinaryStrictVote, RankedChoiceVote } from "@tc/types/Vote";
import utils from "@tc/utils/server";

export function generateDiscordVotingResults(voting: IVoting): IDiscordField[] {
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
