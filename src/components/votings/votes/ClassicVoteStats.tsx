import { Box, Group, Text, ActionIcon, Tooltip, Progress } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IVoting } from "../../../../interfaces/Voting";
import { VOTE_COLORS } from "../../../constants";

interface IProps {
    voting: IVoting;
    onFilterChange?: (optionIndex: number | null) => void;
    activeFilter?: number | null;
}

export default function ClassicVoteStats({ voting, onFilterChange, activeFilter }: IProps) {
    const totalVotes = voting.votes.length;

    const handleFilterClick = (index: number) => {
        if (onFilterChange) {
            onFilterChange(activeFilter === index ? null : index);
        }
    };

    const getWinningOptions = () => {
        const votes = voting.options.map(
            (_, index) => voting.votes.filter((v) => v.data.type === "classic" && v.data.option === index).length
        );
        const maxVotes = Math.max(...votes);
        return votes
            .map((count, index) => ({ count, index }))
            .filter((v) => v.count === maxVotes)
            .map((v) => v.index);
    };

    const winningOptions = getWinningOptions();

    return (
        <>
            {voting.options.map((option, index) => {
                const votes = voting.votes.filter((v) => v.data.type === "classic" && v.data.option === index).length;
                const percentage = totalVotes ? (votes / totalVotes) * 100 : 0;
                const isActive = activeFilter === index;

                return (
                    <Box key={index}>
                        <Group justify="space-between" mb={4}>
                            <Group gap="xs">
                                {onFilterChange && (
                                    <ActionIcon
                                        size="sm"
                                        variant={isActive ? "filled" : "subtle"}
                                        color={isActive ? VOTE_COLORS[index % VOTE_COLORS.length] : "gray"}
                                        onClick={() => handleFilterClick(index)}>
                                        <FontAwesomeIcon icon={!isActive ? "filter" : "filter-circle-xmark"} />
                                    </ActionIcon>
                                )}
                                <Text size="sm" fw={500}>
                                    {option}
                                    {winningOptions.includes(index) && (
                                        <Tooltip label={winningOptions.length > 1 ? "Tied for 1st" : "Winning option"}>
                                            <FontAwesomeIcon
                                                icon="check"
                                                color="var(--mantine-color-success-6)"
                                                style={{ marginLeft: "0.5rem" }}
                                            />
                                        </Tooltip>
                                    )}
                                </Text>
                            </Group>
                            <Text size="sm" c="dimmed">
                                {votes} ({percentage.toFixed(1)}%)
                            </Text>
                        </Group>
                        <Progress
                            value={percentage}
                            color={VOTE_COLORS[index % VOTE_COLORS.length]}
                            size="lg"
                            radius="xl"
                        />
                    </Box>
                );
            })}
        </>
    );
}
