import { Stack, Group, Text, Box, ActionIcon } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IVoting } from "../../../interfaces/Voting";

interface IProps {
    voting: IVoting;
    voteColors: string[];
    onFilterChange?: (optionIndex: number | null) => void;
    activeFilter?: number | null;
}

export default function VotingStats({ voting, voteColors, onFilterChange, activeFilter }: IProps) {
    const totalVotes = voting.votes.length;

    const handleFilterClick = (index: number) => {
        if (onFilterChange) {
            onFilterChange(activeFilter === index ? null : index);
        }
    };

    return (
        <Stack gap="xs">
            {voting.options.map((option, index) => {
                const votes = voting.votes.filter((v) => v.option === index).length;
                const percentage = totalVotes ? (votes / totalVotes) * 100 : 0;
                const isActive = activeFilter === index;

                return (
                    <Box key={index}>
                        <Group justify="space-between" mb={4}>
                            <Group gap="xs">
                                {onFilterChange && (
                                    <ActionIcon
                                        variant={isActive ? "filled" : "subtle"}
                                        color={
                                            isActive
                                                ? voteColors[index % voteColors.length]
                                                : "gray"
                                        }
                                        onClick={() => handleFilterClick(index)}
                                        size="sm">
                                        <FontAwesomeIcon icon={!isActive ? "filter" : "filter-circle-xmark"} />
                                    </ActionIcon>
                                )}
                                <Text size="sm" fw={500}>
                                    {option}
                                </Text>
                            </Group>
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
