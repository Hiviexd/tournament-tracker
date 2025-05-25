import { Stack, Group, Text, Box, Badge } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IVoting } from "../../../../interfaces/Voting";
import { RankedChoiceVote } from "../../../../interfaces/Vote";
import { VOTE_COLORS } from "../../../constants";

interface IProps {
    voting: IVoting;
}

// Schulze method implementation
function calculateSchulzeWinner(votes: RankedChoiceVote[], optionCount: number): number[] {
    // Create preference matrix - d[i][j] is number of voters who prefer option i over option j
    const d: number[][] = Array(optionCount)
        .fill(null)
        .map(() => Array(optionCount).fill(0));

    votes.forEach((vote) => {
        for (let i = 0; i < optionCount; i++) {
            for (let j = 0; j < optionCount; j++) {
                if (i !== j) {
                    const scoreI = vote.scores.find((s) => s.optionIndex === i)?.score ?? 0;
                    const scoreJ = vote.scores.find((s) => s.optionIndex === j)?.score ?? 0;

                    if (scoreI > scoreJ) {
                        d[i][j]++;
                    }
                }
            }
        }
    });

    // Calculate strongest paths using Floyd-Warshall algorithm
    const p: number[][] = Array(optionCount)
        .fill(null)
        .map(() => Array(optionCount).fill(0));

    // Initialize strongest paths
    for (let i = 0; i < optionCount; i++) {
        for (let j = 0; j < optionCount; j++) {
            if (i !== j) {
                p[i][j] = d[i][j] > d[j][i] ? d[i][j] : 0;
            }
        }
    }

    // Find strongest paths
    for (let k = 0; k < optionCount; k++) {
        for (let i = 0; i < optionCount; i++) {
            for (let j = 0; j < optionCount; j++) {
                if (i !== j && i !== k && j !== k) {
                    p[i][j] = Math.max(p[i][j], Math.min(p[i][k], p[k][j]));
                }
            }
        }
    }

    // Determine ranking based on strongest paths
    const ranking: Array<{ index: number; wins: number }> = [];
    for (let i = 0; i < optionCount; i++) {
        let wins = 0;
        for (let j = 0; j < optionCount; j++) {
            if (i !== j && p[i][j] > p[j][i]) {
                wins++;
            }
        }
        ranking.push({ index: i, wins });
    }

    // Sort by number of wins (descending)
    ranking.sort((a, b) => b.wins - a.wins);

    return ranking.map((r) => r.index);
}

export default function RankedChoiceVoteStats({ voting }: IProps) {
    const totalVotes = voting.votes.length;
    const rankedChoiceVotes = voting.votes.filter(
        (v): v is typeof v & { data: RankedChoiceVote } => v.data.type === "ranked-choice"
    );

    // Calculate Schulze ranking
    const schulzeRanking = calculateSchulzeWinner(
        rankedChoiceVotes.map((v) => v.data),
        voting.options.length
    );

    return (
        <Stack gap="md">
            <Group align="center" gap="xs">
                <Text fw={500}>Total Votes:</Text>
                <Text c="dimmed">{totalVotes}</Text>
            </Group>

            <Text size="sm" fw={500}>
                Schulze Method Results:
            </Text>

            {schulzeRanking.map((optionIndex, rank) => {
                const option = voting.options[optionIndex];
                const isWinner = rank === 0;

                return (
                    <Box key={optionIndex}>
                        <Group gap="xs" mb="sm" align="center">
                            {isWinner && <FontAwesomeIcon icon="trophy" color="var(--mantine-color-yellow-6)" />}
                            {!isWinner && (
                                <Text size="sm" fw={500} c="dimmed">
                                    #{rank + 1}
                                </Text>
                            )}
                            <Badge
                                variant="light"
                                style={{
                                    backgroundColor: `color-mix(in srgb, ${
                                        VOTE_COLORS[optionIndex % VOTE_COLORS.length]
                                    } 15%, transparent)`,
                                    color: VOTE_COLORS[optionIndex % VOTE_COLORS.length],
                                }}>
                                {option}
                            </Badge>
                        </Group>
                    </Box>
                );
            })}

            <Text size="xs" c="dimmed" fs="italic" mt="md">
                Rankings determined using the Schulze method, which considers pairwise comparisons between all options.
            </Text>
        </Stack>
    );
}
