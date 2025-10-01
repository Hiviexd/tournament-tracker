import { Stack, Group, Text, Progress, Box, ActionIcon } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IVoting } from "../../../../interfaces/Voting";
import { BinaryStrictVote } from "../../../../interfaces/Vote";
import { IconProp } from "@fortawesome/fontawesome-svg-core";

interface IProps {
    voting: IVoting;
    onFilterChange?: (optionIndex: number | null) => void;
    activeFilter?: number | null;
}

export default function BinaryStrictVoteStats({ voting, onFilterChange, activeFilter }: IProps) {
    const totalVotes = voting.votes.length;

    const agreeOption = voting.options[0];
    const disagreeOption = voting.allowNeutralVotes ? voting.options[2] : voting.options[1];
    const neutralOption = voting.allowNeutralVotes ? voting.options[1] : null;

    const binaryStrictVotes = voting.votes.filter(
        (v): v is typeof v & { data: BinaryStrictVote } => v.data.type === "binary-strict"
    );

    const handleFilterClick = (index: number) => {
        if (onFilterChange) {
            onFilterChange(activeFilter === index ? null : index);
        }
    };

    const distribution = {
        agree: binaryStrictVotes.filter((v) => v.data.score === 1).length,
        neutral: binaryStrictVotes.filter((v) => v.data.score === 0).length,
        disagree: binaryStrictVotes.filter((v) => v.data.score === -1).length,
    };

    // Exclude neutral votes for winner calculation
    const nonNeutralVotes = distribution.agree + distribution.disagree;
    const passPercentage = voting.binaryStrictPassThreshold || 50;
    const agreePercentage = nonNeutralVotes > 0 ? (distribution.agree / nonNeutralVotes) * 100 : 0;
    const disagreePercentage = nonNeutralVotes > 0 ? (distribution.disagree / nonNeutralVotes) * 100 : 0;
    const neutralPercentage = totalVotes > 0 ? (distribution.neutral / totalVotes) * 100 : 0;

    // Determine winner (excluding neutrals)
    const getWinner = () => {
        if (distribution.agree === distribution.disagree) return "tie";
        if (agreePercentage >= passPercentage) return "agree";
        return "disagree";
    };

    const getResultColor = (winner: string) => {
        if (winner === "agree")
            return { text: agreeOption, icon: "check-circle", color: "var(--mantine-color-success-6)" };
        if (winner === "disagree")
            return { text: disagreeOption, icon: "times-circle", color: "var(--mantine-color-red-6)" };
        return { text: "Tie", icon: "exclamation-triangle", color: "var(--mantine-color-orange-6)" };
    };

    return (
        <Stack gap="md">
            <Group align="center" gap="xs">
                <Text fw={500}>Total Votes:</Text>
                <Text c="dimmed">{totalVotes}</Text>
                {voting.allowNeutralVotes && (
                    <Text size="sm" c="dimmed">
                        ({nonNeutralVotes} non-neutral)
                    </Text>
                )}
            </Group>

            <Group align="center" gap="xs">
                <Text fw={500}>Pass Threshold:</Text>
                <Text c="dimmed">{passPercentage}%</Text>
            </Group>

            {nonNeutralVotes > 0 && (
                <Group align="center" gap="xs">
                    <Text fw={500}>Result:</Text>
                    <Text fw={500} c={getResultColor(getWinner()).color}>
                        <FontAwesomeIcon icon={getResultColor(getWinner()).icon as IconProp} />{" "}
                        {getResultColor(getWinner()).text}
                    </Text>
                </Group>
            )}

            {nonNeutralVotes > 0 && (
                <Box>
                    <Group justify="space-between" mb={4}>
                        <Group gap="xs">
                            {onFilterChange && (
                                <ActionIcon
                                    size="sm"
                                    variant={activeFilter === 0 ? "filled" : "subtle"}
                                    color={activeFilter === 0 ? "green" : "gray"}
                                    onClick={() => handleFilterClick(0)}>
                                    <FontAwesomeIcon icon={activeFilter === 0 ? "filter-circle-xmark" : "filter"} />
                                </ActionIcon>
                            )}
                            <Text size="sm" fw={500}>
                                {agreeOption}
                            </Text>
                            {getWinner() === "agree" && (
                                <FontAwesomeIcon icon="check" color="var(--mantine-color-success-6)" />
                            )}
                        </Group>
                        <Text size="sm" c="dimmed">
                            {distribution.agree} ({agreePercentage.toFixed(1)}%)
                        </Text>
                    </Group>
                    <Progress value={agreePercentage} color="success" size="lg" radius="xl" mb="md" />

                    <Group justify="space-between" mb={4}>
                        <Group gap="xs">
                            {onFilterChange && (
                                <ActionIcon
                                    size="sm"
                                    variant={activeFilter === (voting.allowNeutralVotes ? 2 : 1) ? "filled" : "subtle"}
                                    color={activeFilter === (voting.allowNeutralVotes ? 2 : 1) ? "red" : "gray"}
                                    onClick={() => handleFilterClick(voting.allowNeutralVotes ? 2 : 1)}>
                                    <FontAwesomeIcon
                                        icon={
                                            activeFilter === (voting.allowNeutralVotes ? 2 : 1)
                                                ? "filter-circle-xmark"
                                                : "filter"
                                        }
                                    />
                                </ActionIcon>
                            )}
                            <Text size="sm" fw={500}>
                                {disagreeOption}
                            </Text>
                            {getWinner() === "disagree" && (
                                <FontAwesomeIcon icon="check" color="var(--mantine-color-success-6)" />
                            )}
                        </Group>
                        <Text size="sm" c="dimmed">
                            {distribution.disagree} ({disagreePercentage.toFixed(1)}%)
                        </Text>
                    </Group>
                    <Progress value={disagreePercentage} color="red" size="lg" radius="xl" />

                    {distribution.neutral > 0 && (
                        <>
                            <Group justify="space-between" mt="md" mb={4}>
                                <Group gap="xs">
                                    {onFilterChange && (
                                        <ActionIcon
                                            size="sm"
                                            variant={activeFilter === 1 ? "filled" : "subtle"}
                                            color={activeFilter === 1 ? "gray" : "gray"}
                                            onClick={() => handleFilterClick(1)}>
                                            <FontAwesomeIcon
                                                icon={activeFilter === 1 ? "filter-circle-xmark" : "filter"}
                                            />
                                        </ActionIcon>
                                    )}
                                    <Text size="sm" fw={500} c="gray.6">
                                        {neutralOption} (excluded from result)
                                    </Text>
                                </Group>
                                <Text size="sm" c="dimmed">
                                    {distribution.neutral} ({neutralPercentage.toFixed(1)}%)
                                </Text>
                            </Group>
                        </>
                    )}
                </Box>
            )}
        </Stack>
    );
}
