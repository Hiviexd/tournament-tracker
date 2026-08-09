import { Stack, Group, Text, Box, Badge } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IVoting } from "@tc/types/Voting";
import { RankedChoiceVote } from "@tc/types/Vote";
import { VOTE_COLORS } from "../../../constants";
import utils from "@tc/utils/client";

interface IProps {
    voting: IVoting;
}

export default function RankedChoiceVoteStats({ voting }: IProps) {
    const totalVotes = voting.votes.length;
    const rankedChoiceVotes = voting.votes.filter(
        (v): v is typeof v & { data: RankedChoiceVote } => v.data.type === "ranked-choice",
    );

    // Calculate Schulze ranking
    const schulzeRanking = utils.calculateSchulzeWinner(
        rankedChoiceVotes.map((v) => v.data),
        voting.options.length,
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
