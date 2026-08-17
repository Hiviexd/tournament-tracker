import { Stack, Group, Text, Box, Badge, Tooltip, ActionIcon } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IVoting } from "@tc/types/Voting";
import { RankedChoiceVote } from "@tc/types/Vote";
import { VOTE_BADGE_COLORS } from "../../../../constants";
import utils from "@tc/utils/client";

interface IProps {
    voting: IVoting;
}

export default function RankedChoiceVoteResults({ voting }: IProps) {
    const rankedChoiceVotes = voting.votes.filter(
        (v): v is typeof v & { data: RankedChoiceVote } => v.data.type === "ranked-choice",
    );
    const totalVotes = rankedChoiceVotes.length;

    if (totalVotes === 0) {
        return (
            <Text size="sm" c="dimmed">
                No votes yet
            </Text>
        );
    }

    const { ranking, places, wins } = utils.getSchulzeResult(
        rankedChoiceVotes.map((v) => v.data),
        voting.options.length,
    );

    return (
        <Stack gap="md">
            <Group align="center" gap="xs">
                <Text fw={500}>Total Votes:</Text>
                <Text c="dimmed">{totalVotes}</Text>
            </Group>

            <Group align="center" gap={6}>
                <Text size="sm" fw={500}>
                    Schulze ranking
                </Text>
                <Tooltip
                    label="Rankings use the Schulze method, which considers pairwise comparisons between all options."
                    multiline
                    ta="center"
                    maw={280}>
                    <ActionIcon variant="subtle" color="gray" size="sm" aria-label="About Schulze ranking">
                        <FontAwesomeIcon icon="info-circle" />
                    </ActionIcon>
                </Tooltip>
            </Group>

            {ranking.map((optionIndex, i) => {
                const option = voting.options[optionIndex] ?? "";
                const place = places[i] ?? i + 1;
                const pairwiseWins = wins[i] ?? 0;
                const isTie = places.filter((p) => p === place).length > 1;
                const color = VOTE_BADGE_COLORS[optionIndex % VOTE_BADGE_COLORS.length];

                return (
                    <Box key={optionIndex}>
                        <Group gap="xs" wrap="nowrap" align="center">
                            {place === 1 ? (
                                <Tooltip label={isTie ? "Tied for 1st" : "Winner"}>
                                    <Group gap={6} wrap="nowrap" style={{ flexShrink: 0 }}>
                                        <FontAwesomeIcon icon="trophy" color="var(--mantine-color-yellow-6)" />
                                        {isTie && (
                                            <Text size="xs" c="dimmed">
                                                tied
                                            </Text>
                                        )}
                                    </Group>
                                </Tooltip>
                            ) : (
                                <Text size="sm" fw={500} c="dimmed" style={{ flexShrink: 0 }}>
                                    #{place}
                                    {isTie ? " tied" : ""}
                                </Text>
                            )}
                            <Badge variant="light" color={color} maw="100%" style={{ minWidth: 0, flex: 1 }}>
                                {option}
                            </Badge>
                            <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>
                                {pairwiseWins} pairwise {pairwiseWins === 1 ? "win" : "wins"}
                            </Text>
                        </Group>
                    </Box>
                );
            })}
        </Stack>
    );
}
