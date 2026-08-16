import { Stack, Group, Text, Box, ActionIcon } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IVoting } from "@tc/types/Voting";
import { BinaryStrictVote } from "@tc/types/Vote";
import { useAtom } from "jotai";
import { loggedInUserAtom } from "../../../../store/atoms";
import { useMemo } from "react";
import { TruncatedText } from "../../../common/TruncatedText";

interface IProps {
    voting: IVoting;
    onFilterChange?: (optionIndex: number | null) => void;
    activeFilter?: number | null;
}

type StrictResult = "none" | "tie" | "passed" | "failed";

export default function BinaryStrictVoteStats({ voting, onFilterChange, activeFilter }: IProps) {
    const [user] = useAtom(loggedInUserAtom);
    const canFilter = useMemo(() => user?.isCommitteeOrAdmin && onFilterChange, [user, onFilterChange]);

    const agreeOption = voting.options[0];
    const disagreeOption = voting.allowNeutralVotes ? voting.options[2] : voting.options[1];
    const neutralOption = voting.allowNeutralVotes ? voting.options[1] : null;
    const disagreeIndex = voting.allowNeutralVotes ? 2 : 1;

    const binaryStrictVotes = voting.votes.filter(
        (v): v is typeof v & { data: BinaryStrictVote } => v.data.type === "binary-strict",
    );

    const distribution = {
        agree: binaryStrictVotes.filter((v) => v.data.score === 1).length,
        neutral: binaryStrictVotes.filter((v) => v.data.score === 0).length,
        disagree: binaryStrictVotes.filter((v) => v.data.score === -1).length,
    };

    const totalVotes = voting.votes.length;
    const nonNeutralVotes = distribution.agree + distribution.disagree;
    const passPercentage = voting.binaryStrictPassThreshold || 50;
    const agreePercentage = nonNeutralVotes > 0 ? (distribution.agree / nonNeutralVotes) * 100 : 0;

    const result: StrictResult =
        nonNeutralVotes === 0
            ? "none"
            : distribution.agree === distribution.disagree
              ? "tie"
              : agreePercentage >= passPercentage
                ? "passed"
                : "failed";

    const handleFilterClick = (index: number) => {
        onFilterChange?.(activeFilter === index ? null : index);
    };

    const slices = [
        { key: "agree", value: distribution.agree, color: "success.6" },
        ...(voting.allowNeutralVotes ? [{ key: "neutral", value: distribution.neutral, color: "gray.6" }] : []),
        { key: "disagree", value: distribution.disagree, color: "danger.6" },
    ];
    const sliceTotal = slices.reduce((sum, slice) => sum + slice.value, 0);

    const resultDisplay = {
        none: { color: "gray", icon: "minus" as const, text: "No result" },
        tie: { color: "warning", icon: "exclamation-triangle" as const, text: "Tie" },
        passed: { color: "success", icon: "check-circle" as const, text: `Passed — ${agreeOption}` },
        failed: {
            color: "danger",
            icon: "times-circle" as const,
            text: `Failed — ${agreePercentage.toFixed(1)}% ${agreeOption} (need ${passPercentage}%)`,
        },
    }[result];

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

            <Group align="center" gap="xs" wrap="nowrap">
                <Text fw={500} style={{ flexShrink: 0 }}>
                    Result:
                </Text>
                <Text fw={500} c={resultDisplay.color} style={{ minWidth: 0 }}>
                    <FontAwesomeIcon icon={resultDisplay.icon} /> {resultDisplay.text}
                </Text>
            </Group>

            <Box h={12} bg="dark.5" style={{ borderRadius: 999, overflow: "hidden" }}>
                {sliceTotal > 0 && (
                    <Group gap={0} wrap="nowrap" h="100%">
                        {slices
                            .filter((slice) => slice.value > 0)
                            .map((slice) => (
                                <Box
                                    key={slice.key}
                                    h="100%"
                                    bg={slice.color}
                                    style={{ width: `${(slice.value / sliceTotal) * 100}%` }}
                                />
                            ))}
                    </Group>
                )}
            </Box>

            <Stack gap="xs">
                <OptionRow
                    canFilter={Boolean(canFilter)}
                    isActive={activeFilter === 0}
                    color="success"
                    label={agreeOption ?? ""}
                    count={distribution.agree}
                    detail={nonNeutralVotes > 0 ? `${agreePercentage.toFixed(1)}% of non-neutral` : undefined}
                    onFilterClick={() => handleFilterClick(0)}
                />
                {voting.allowNeutralVotes && (
                    <OptionRow
                        canFilter={Boolean(canFilter)}
                        isActive={activeFilter === 1}
                        color="gray"
                        label={`${neutralOption ?? "Neutral"} (excluded)`}
                        count={distribution.neutral}
                        detail={totalVotes > 0 ? `${((distribution.neutral / totalVotes) * 100).toFixed(1)}% of total` : undefined}
                        onFilterClick={() => handleFilterClick(1)}
                    />
                )}
                <OptionRow
                    canFilter={Boolean(canFilter)}
                    isActive={activeFilter === disagreeIndex}
                    color="danger"
                    label={disagreeOption ?? ""}
                    count={distribution.disagree}
                    detail={
                        nonNeutralVotes > 0
                            ? `${((distribution.disagree / nonNeutralVotes) * 100).toFixed(1)}% of non-neutral`
                            : undefined
                    }
                    onFilterClick={() => handleFilterClick(disagreeIndex)}
                />
            </Stack>
        </Stack>
    );
}

function OptionRow({
    canFilter,
    isActive,
    color,
    label,
    count,
    detail,
    onFilterClick,
}: {
    canFilter: boolean;
    isActive: boolean;
    color: string;
    label: string;
    count: number;
    detail?: string;
    onFilterClick: () => void;
}) {
    return (
        <Group justify="space-between" wrap="nowrap" gap="xs">
            <Group gap="xs" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                {canFilter && (
                    <ActionIcon
                        size="sm"
                        variant={isActive ? "filled" : "subtle"}
                        color={isActive ? color : "gray"}
                        onClick={onFilterClick}>
                        <FontAwesomeIcon icon={isActive ? "filter-circle-xmark" : "filter"} />
                    </ActionIcon>
                )}
                <TruncatedText size="sm" fw={500} style={{ flex: 1, minWidth: 0 }}>
                    {label}
                </TruncatedText>
            </Group>
            <Text size="sm" c="dimmed" ta="right" style={{ flexShrink: 0 }}>
                {count}
                {detail ? ` (${detail})` : ""}
            </Text>
        </Group>
    );
}
