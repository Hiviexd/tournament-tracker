import { Stack, Group, Text, Table } from "@mantine/core";
import { IVoting } from "@tc/types/Voting";
import { BinaryVote } from "@tc/types/Vote";
import { getScoreColor } from "./voteScoreColor";

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
                <Table
                    withTableBorder={false}
                    withColumnBorders={false}
                    withRowBorders={false}
                    ml="md"
                    styles={{
                        table: {
                            backgroundColor: "transparent",
                            width: "fit-content",
                        },
                        tbody: { backgroundColor: "transparent" },
                        tr: { backgroundColor: "transparent" },
                        td: {
                            backgroundColor: "transparent",
                            padding: "4px 16px 4px 0",
                            border: "none",
                        },
                    }}>
                    <Table.Tbody>
                        {[
                            { label: `${voting.options[0]}`, count: distribution.positive, color: "green.6" },
                            { label: "Neutral", count: distribution.neutral, color: "gray.6" },
                            { label: `${voting.options[1]}`, count: distribution.negative, color: "red.6" },
                        ].map(({ label, count, color }) => (
                            <Table.Tr key={label}>
                                <Table.Td>
                                    <Text size="sm" title={label}>
                                        {label}
                                    </Text>
                                </Table.Td>
                                <Table.Td style={{ textAlign: "center" }}>
                                    <Text size="sm" c={color}>
                                        {count}
                                    </Text>
                                </Table.Td>
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>
            </Stack>
        </Stack>
    );
}
