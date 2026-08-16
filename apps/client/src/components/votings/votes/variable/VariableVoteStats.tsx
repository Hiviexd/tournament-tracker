import { Stack, Group, Text, Box } from "@mantine/core";
import { IVoting } from "@tc/types/Voting";
import { VariableVote } from "@tc/types/Vote";
import { formatSignedScore, getScoreColor } from "../voteScoreColor";
import ScoreMeter from "../ScoreMeter";
import { TruncatedText } from "../../../common/TruncatedText";

interface IProps {
    voting: IVoting;
}

export default function VariableVoteStats({ voting }: IProps) {
    const variableVotes = voting.votes.filter(
        (v): v is typeof v & { data: VariableVote } => v.data.type === "variable",
    );
    const totalVotes = variableVotes.length;

    if (totalVotes === 0) {
        return (
            <Text size="sm" c="dimmed">
                No votes yet
            </Text>
        );
    }

    return (
        <Stack gap="md">
            <Text c="dimmed" size="sm" fw={500}>
                Total Votes: {totalVotes}
            </Text>
            {voting.options.map((option, index) => {
                const scores = variableVotes.flatMap((v) => {
                    const entry = v.data.scores.find((s) => s.optionIndex === index);
                    return entry ? [entry.score] : [];
                });
                const avgScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
                const color = avgScore === null ? "dimmed" : getScoreColor(avgScore);

                return (
                    <Box key={index}>
                        <Group justify="space-between" mb={4} wrap="nowrap" gap="xs">
                            <TruncatedText size="sm" fw={500} style={{ flex: 1, minWidth: 0 }}>
                                {option}
                            </TruncatedText>
                            <Text size="sm" c={color} style={{ flexShrink: 0 }}>
                                {avgScore === null ? "—" : formatSignedScore(avgScore, 2)}
                            </Text>
                        </Group>
                        {avgScore !== null && (
                            <ScoreMeter
                                score={avgScore}
                                label={`Average ${formatSignedScore(avgScore, 2)} for ${option}`}
                            />
                        )}
                    </Box>
                );
            })}
        </Stack>
    );
}
