import { Badge, Card, Group, Stack, parseThemeColor, rgba, useMantineTheme } from "@mantine/core";
import { VariableVoteScore } from "@tc/types/Vote";
import { TruncatedText } from "../../common/TruncatedText";
import { formatSignedScore, getScoreColor } from "./voteScoreColor";

interface IProps {
    scores: VariableVoteScore[];
    options: string[];
}

function ScoreBadge({ score }: { score: number }) {
    const theme = useMantineTheme();
    const parsed = parseThemeColor({ color: getScoreColor(score), theme });

    return (
        <Badge
            size="sm"
            variant="light"
            w={{ base: 60, sm: 40 }}
            styles={{
                root: {
                    background: rgba(parsed.value, 0.15),
                    color: parsed.value,
                    border: "none",
                    textAlign: "center",
                },
            }}>
            {formatSignedScore(score)}
        </Badge>
    );
}

export default function VariableVoteDisplay({ scores, options }: IProps) {
    return (
        <Card bg="primary.11" p="xs" radius="sm" withBorder>
            <Stack gap={4}>
                {scores.map((entry) => (
                    <Group key={entry.optionIndex} wrap="nowrap" justify="space-between">
                        <TruncatedText size="sm" w={{ base: 500, sm: 200 }}>
                            {options[entry.optionIndex] ?? ""}
                        </TruncatedText>
                        <ScoreBadge score={entry.score} />
                    </Group>
                ))}
            </Stack>
        </Card>
    );
}
