import { Stack, Group, Text, Box, Progress } from "@mantine/core";
import { IVoting } from "@tc/types/Voting";
import { VariableVote } from "@tc/types/Vote";
import { getScoreColor } from "./voteScoreColor";

interface IProps {
    voting: IVoting;
}

export default function VariableVoteStats({ voting }: IProps) {
    const totalVotes = voting.votes.length;
    const variableVotes = voting.votes.filter(
        (v): v is typeof v & { data: VariableVote } => v.data.type === "variable",
    );

    return (
        <Stack gap="md">
            <Text c="dimmed" size="sm" fw={500}>
                Total Votes: {totalVotes}
            </Text>
            {voting.options.map((option, index) => {
                const scores = variableVotes.map((v) => v.data.scores.find((s) => s.optionIndex === index)?.score ?? 0);
                const avgScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
                const color = getScoreColor(avgScore);

                return (
                    <Box key={index}>
                        <Group justify="space-between" mb={4}>
                            <Text size="sm" fw={500}>
                                {option}
                            </Text>
                            <Group gap="xs">
                                <Text size="sm" c={color}>
                                    {avgScore.toFixed(2)}
                                </Text>
                            </Group>
                        </Group>
                        <Progress value={((avgScore + 5) / 10) * 100} color={color} size="lg" radius="xl" />
                    </Box>
                );
            })}
        </Stack>
    );
}
