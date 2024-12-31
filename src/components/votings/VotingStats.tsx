import { Stack, Group, Text, Box } from "@mantine/core";
import { IVoting } from "../../../interfaces/Voting";

interface IProps {
    voting: IVoting;
    voteColors: string[];
}

export default function VotingStats({ voting, voteColors }: IProps) {
    const totalVotes = voting.votes.length;

    return (
        <Stack gap="xs">
            {voting.options.map((option, index) => {
                const votes = voting.votes.filter((v) => v.option === index).length;
                const percentage = totalVotes ? (votes / totalVotes) * 100 : 0;

                return (
                    <Box key={index}>
                        <Group justify="space-between" mb={4}>
                            <Text size="sm" fw={500}>
                                {option}
                            </Text>
                            <Text size="sm" c="dimmed">
                                {votes} ({percentage.toFixed(1)}%)
                            </Text>
                        </Group>
                        <Box
                            style={{
                                width: "100%",
                                height: "8px",
                                backgroundColor: "var(--mantine-color-dark-4)",
                                borderRadius: "4px",
                                overflow: "hidden",
                            }}>
                            <Box
                                style={{
                                    width: `${percentage}%`,
                                    height: "100%",
                                    backgroundColor: voteColors[index % voteColors.length],
                                    transition: "width 0.3s ease",
                                }}
                            />
                        </Box>
                    </Box>
                );
            })}
        </Stack>
    );
}
