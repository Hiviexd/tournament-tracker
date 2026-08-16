import { Stack, Group, Text, Box, Tooltip } from "@mantine/core";
import { IVoting } from "@tc/types/Voting";
import { BinaryVote } from "@tc/types/Vote";
import { formatSignedScore, getScoreColor } from "../voteScoreColor";
import ScoreMeter from "../ScoreMeter";
import { TruncatedText } from "../../../common/TruncatedText";

interface IProps {
    voting: IVoting;
}

const SCORE_MIN = -5;
const SCORE_MAX = 5;
const DOT = 8;
const DOT_GAP = 2;

export default function BinaryVoteResults({ voting }: IProps) {
    const binaryVotes = voting.votes.filter((v): v is typeof v & { data: BinaryVote } => v.data.type === "binary");
    const scores = binaryVotes.map((v) => v.data.score);
    const totalVotes = scores.length;

    if (totalVotes === 0) {
        return (
            <Text size="sm" c="dimmed">
                No votes yet
            </Text>
        );
    }

    const avgScore = scores.reduce((a, b) => a + b, 0) / totalVotes;
    const buckets = Array.from({ length: SCORE_MAX - SCORE_MIN + 1 }, (_, i) => {
        const score = SCORE_MIN + i;
        return { score, count: scores.filter((s) => s === score).length };
    });
    const maxCount = Math.max(1, ...buckets.map((b) => b.count));
    const stripHeight = maxCount * DOT + Math.max(0, maxCount - 1) * DOT_GAP;
    const distribution = {
        positive: scores.filter((s) => s > 0).length,
        neutral: scores.filter((s) => s === 0).length,
        negative: scores.filter((s) => s < 0).length,
    };

    return (
        <Stack gap="md">
            <Stack gap={6}>
                <Group align="center" gap="xs" wrap="nowrap">
                    <TruncatedText size="sm" c="dimmed" style={{ flex: 1, minWidth: 0 }}>
                        {voting.options[1] ?? ""}
                    </TruncatedText>
                    <Text fw={600} c={getScoreColor(avgScore)} style={{ flexShrink: 0 }}>
                        {formatSignedScore(avgScore, 2)}
                    </Text>
                    <TruncatedText size="sm" c="dimmed" ta="right" style={{ flex: 1, minWidth: 0 }}>
                        {voting.options[0] ?? ""}
                    </TruncatedText>
                </Group>
                <Box>
                    <Box h={stripHeight} pos="relative" mb={4}>
                        {buckets.map(({ score, count }) => {
                            if (count === 0) return null;
                            const left = ((score - SCORE_MIN) / (SCORE_MAX - SCORE_MIN)) * 100;

                            return (
                                <Tooltip
                                    key={score}
                                    label={`${formatSignedScore(score)}: ${count} ${count === 1 ? "vote" : "votes"}`}>
                                    <Box
                                        pos="absolute"
                                        bottom={0}
                                        style={{
                                            left: `${left}%`,
                                            transform: "translateX(-50%)",
                                            cursor: "default",
                                        }}>
                                        <Stack gap={DOT_GAP} align="center">
                                            {Array.from({ length: count }, (_, i) => (
                                                <Box
                                                    key={i}
                                                    w={DOT}
                                                    h={DOT}
                                                    bg={getScoreColor(score)}
                                                    style={{
                                                        borderRadius: 999,
                                                        boxShadow: "0 0 0 1px var(--mantine-color-dark-4)",
                                                    }}
                                                />
                                            ))}
                                        </Stack>
                                    </Box>
                                </Tooltip>
                            );
                        })}
                    </Box>
                    <ScoreMeter score={avgScore} label={`Average score ${formatSignedScore(avgScore, 2)}`} />
                </Box>
                <Text size="xs" c="dimmed" ta="center">
                    {totalVotes} {totalVotes === 1 ? "vote" : "votes"}
                </Text>
            </Stack>

            <Stack gap={4}>
                {[
                    { label: voting.options[0] ?? "", count: distribution.positive, color: "green.6" },
                    { label: "Neutral", count: distribution.neutral, color: "gray.6" },
                    { label: voting.options[1] ?? "", count: distribution.negative, color: "red.6" },
                ].map(({ label, count, color }) => (
                    <Group key={label} justify="space-between" wrap="nowrap" gap="xs">
                        <TruncatedText size="sm" style={{ flex: 1, minWidth: 0 }}>
                            {label}
                        </TruncatedText>
                        <Text size="sm" c={color} style={{ flexShrink: 0 }}>
                            {count}
                        </Text>
                    </Group>
                ))}
            </Stack>
        </Stack>
    );
}
