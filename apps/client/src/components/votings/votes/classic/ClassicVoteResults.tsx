import { Box, Group, Text, ActionIcon, Tooltip, Progress, Stack } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IVoting } from "@tc/types/Voting";
import { VOTE_BADGE_COLORS } from "../../../../constants";
import { useAtom } from "jotai";
import { loggedInUserAtom } from "../../../../store/atoms";
import { useMemo } from "react";
import { TruncatedText } from "../../../common/TruncatedText";

interface IProps {
    voting: IVoting;
    onFilterChange?: (optionIndex: number | null) => void;
    activeFilter?: number | null;
}

export default function ClassicVoteResults({ voting, onFilterChange, activeFilter }: IProps) {
    const [user] = useAtom(loggedInUserAtom);
    const canFilter = useMemo(() => user?.isCommitteeOrAdmin && onFilterChange, [user, onFilterChange]);

    const counts = useMemo(
        () =>
            voting.options.map(
                (_, index) => voting.votes.filter((v) => v.data.type === "classic" && v.data.option === index).length,
            ),
        [voting.options, voting.votes],
    );

    const totalVotes = voting.votes.length;
    const maxVotes = Math.max(0, ...counts);
    const winningOptions = useMemo(() => {
        if (maxVotes === 0) return [];
        return counts.flatMap((count, index) => (count === maxVotes ? [index] : []));
    }, [counts, maxVotes]);

    const handleFilterClick = (index: number) => {
        onFilterChange?.(activeFilter === index ? null : index);
    };

    return (
        <Stack gap="md">
            {voting.options.map((option, index) => {
                const votes = counts[index] ?? 0;
                const percentage = totalVotes ? (votes / totalVotes) * 100 : 0;
                const isActive = activeFilter === index;
                const color = VOTE_BADGE_COLORS[index % VOTE_BADGE_COLORS.length];
                const isWinner = winningOptions.includes(index);

                return (
                    <Box key={index}>
                        <Group justify="space-between" mb={4} wrap="nowrap" gap="xs">
                            <Group gap="xs" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                                {canFilter && (
                                    <ActionIcon
                                        size="sm"
                                        variant={isActive ? "filled" : "subtle"}
                                        color={isActive ? color : "gray"}
                                        onClick={() => handleFilterClick(index)}>
                                        <FontAwesomeIcon icon={!isActive ? "filter" : "filter-circle-xmark"} />
                                    </ActionIcon>
                                )}
                                <TruncatedText size="sm" fw={500} style={{ flex: 1, minWidth: 0 }}>
                                    {option}
                                </TruncatedText>
                                {isWinner && (
                                    <Tooltip label={winningOptions.length > 1 ? "Tied for 1st" : "Winning option"}>
                                        <FontAwesomeIcon
                                            icon="check"
                                            color="var(--mantine-color-success-6)"
                                            style={{ flexShrink: 0 }}
                                        />
                                    </Tooltip>
                                )}
                            </Group>
                            <Text size="sm" c="dimmed" style={{ flexShrink: 0 }}>
                                {votes} ({percentage.toFixed(1)}%)
                            </Text>
                        </Group>
                        <Progress value={percentage} color={color} size="lg" radius="xl" />
                    </Box>
                );
            })}
        </Stack>
    );
}
