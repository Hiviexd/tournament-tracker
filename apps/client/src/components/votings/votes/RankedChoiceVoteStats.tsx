import { Stack, Group, Text, Box, Badge, Tooltip } from "@mantine/core";
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

    const { ranking, places } = utils.getSchulzeResult(
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

            {ranking.map((optionIndex, i) => {
                const option = voting.options[optionIndex];
                const place = places[i];
                const isWinner = place === 1;
                const isTie = places.filter((p) => p === place).length > 1;

                return (
                    <Box key={optionIndex}>
                        <Group gap="xs" mb="sm" align="center">
                            {isWinner ? (
                                <Tooltip label={isTie ? "Tied for 1st" : "Winner"}>
                                    <FontAwesomeIcon icon="trophy" color="var(--mantine-color-yellow-6)" />
                                </Tooltip>
                            ) : (
                                <Tooltip disabled={!isTie} label={`Tied for ${place}`}>
                                    <Text size="sm" fw={500} c="dimmed">
                                        #{place}
                                    </Text>
                                </Tooltip>
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
