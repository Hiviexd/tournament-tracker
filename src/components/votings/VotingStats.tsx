import { Stack, Group, Text, Box, ActionIcon, Tooltip, Progress } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IVoting } from "../../../interfaces/Voting";
import { VOTE_COLORS } from "../../constants";
import { BinaryVote, VariableVote } from "../../../interfaces/Vote";

interface IProps {
    voting: IVoting;
    onFilterChange?: (optionIndex: number | null) => void;
    activeFilter?: number | null;
}

export default function VotingStats({ voting, onFilterChange, activeFilter }: IProps) {
    const totalVotes = voting.votes.length;

    const handleFilterClick = (index: number) => {
        if (onFilterChange) {
            onFilterChange(activeFilter === index ? null : index);
        }
    };

    const renderClassicStats = () => {
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

        return voting.options.map((option, index) => {
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
        });
    };

    const renderBinaryStats = () => {
        const binaryVotes = voting.votes.filter((v): v is typeof v & { data: BinaryVote } => v.data.type === "binary");
        const scores = binaryVotes.map((v) => v.data.score);
        const avgScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

        const distribution = {
            positive: scores.filter((s) => s > 0).length,
            neutral: scores.filter((s) => s === 0).length,
            negative: scores.filter((s) => s < 0).length,
        };

        return (
            <Stack gap="md">
                <Group align="center" gap="xs">
                    <Text fw={500}>Average Score:</Text>
                    <Text c={avgScore > 0 ? "green" : avgScore < 0 ? "red" : "dimmed"}>{avgScore.toFixed(2)}</Text>
                    <Text c="dimmed">({totalVotes} votes)</Text>
                </Group>
                <Stack gap="xs">
                    <Text size="sm" fw={500}>
                        Distribution:
                    </Text>
                    <Stack gap={4}>
                        {[
                            { label: `${voting.options[0]} (1 to 5)`, count: distribution.positive, color: "green" },
                            { label: "Neutral (0)", count: distribution.neutral, color: "gray" },
                            { label: `${voting.options[1]} (-5 to -1)`, count: distribution.negative, color: "red" },
                        ].map(({ label, count, color }) => (
                            <Group key={label} wrap="nowrap">
                                <Text size="sm" w={150} truncate title={label}>
                                    {label}
                                </Text>
                                <Text size="sm" c={color} w={40} style={{ textAlign: "center" }}>
                                    {count}
                                </Text>
                            </Group>
                        ))}
                    </Stack>
                </Stack>
            </Stack>
        );
    };

    const renderVariableStats = () => {
        const variableVotes = voting.votes.filter(
            (v): v is typeof v & { data: VariableVote } => v.data.type === "variable"
        );

        return voting.options.map((option, index) => {
            const scores = variableVotes.map((v) => v.data.scores.find((s) => s.optionIndex === index)?.score ?? 0);
            const avgScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

            return (
                <Box key={index}>
                    <Group justify="space-between" mb={4}>
                        <Text size="sm" fw={500}>
                            {option}
                        </Text>
                        <Group gap="xs">
                            <Text size="sm" c={avgScore > 0 ? "green" : avgScore < 0 ? "red" : "gray.6"}>
                                {avgScore.toFixed(2)}
                            </Text>
                            <Text size="sm" c="dimmed">
                                ({scores.length} votes)
                            </Text>
                        </Group>
                    </Group>
                    <Progress
                        value={((avgScore + 5) / 10) * 100}
                        color={avgScore > 0 ? "green" : avgScore < 0 ? "red" : "gray.6"}
                        size="lg"
                        radius="xl"
                    />
                </Box>
            );
        });
    };

    return (
        <Stack gap="md">
            {(() => {
                switch (voting.type) {
                    case "classic":
                        return renderClassicStats();
                    case "binary":
                        return renderBinaryStats();
                    case "variable":
                        return renderVariableStats();
                }
            })()}
        </Stack>
    );
}
