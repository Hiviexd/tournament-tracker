import { IVoting } from "../../interfaces/Voting";
import { IVote } from "../../interfaces/Vote";
import { IUser } from "@interfaces/User";
import { IDiscordField } from "@interfaces/Discord";
import { BinaryVote, VariableVote } from "@interfaces/Vote";

class VotingService {
    public censorVotingForNonCommittee(voting: IVoting) {
        const publicVoting = voting.toObject();
        publicVoting.author = undefined as unknown as IUser;
        publicVoting.description = "";
        publicVoting.attachments = [];
        publicVoting.votes = publicVoting.votes.map((vote) => ({
            ...vote,
            comment: undefined,
            author: undefined,
        })) as unknown as IVote[];
        return publicVoting;
    }

    public generateVotingResults(voting: IVoting): IDiscordField[] {
        const fields: IDiscordField[] = [];

        switch (voting.type) {
            case "classic": {
                const optionCounts = voting.options.map((option, index) => {
                    const votes = voting.votes.filter(
                        (v) => v.data.type === "classic" && v.data.option === index
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
                    }
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
                    }
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
                    }
                );
                break;
            }
        }

        return fields;
    }
}

export default new VotingService();
