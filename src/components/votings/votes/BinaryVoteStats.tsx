import { Stack, Group, Text } from "@mantine/core";
import { IVoting } from "../../../../interfaces/Voting";
import { BinaryVote } from "../../../../interfaces/Vote";

const getScoreColor = (score: number) => {
    if (score === 0) return "gray.2";
    const intensity = Math.abs(score);
    const level = Math.round((intensity / 5) * 8); // Map 0-5 to color levels 1-8
    const color = score > 0 ? "green" : "red";
    return `${color}.${level}`;
};

interface IProps {
    voting: IVoting;
}

export default function BinaryVoteStats({ voting }: IProps) {
    const totalVotes = voting.votes.length;
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
                <Text c={getScoreColor(avgScore)}>{avgScore.toFixed(2)}</Text>
                <Text c="dimmed">({totalVotes} votes)</Text>
            </Group>
            <Stack gap="xs">
                <Text size="sm" fw={500}>
                    Distribution:
                </Text>
                <Stack gap={4}>
                    {[
                        { label: `${voting.options[0]}`, count: distribution.positive, color: "green.6" },
                        { label: "Neutral", count: distribution.neutral, color: "gray.6" },
                        { label: `${voting.options[1]}`, count: distribution.negative, color: "red.6" },
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
}
