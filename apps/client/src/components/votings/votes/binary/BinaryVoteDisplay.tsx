import { Group, Stack, Text } from "@mantine/core";
import { TruncatedText } from "../../../common/TruncatedText";
import { formatSignedScore, getScoreColor } from "../voteScoreColor";
import ScoreMeter from "../ScoreMeter";

interface IProps {
    score: number;
    options: string[];
}

export default function BinaryVoteDisplay({ score, options }: IProps) {
    const color = getScoreColor(score);
    const toward = score >= 0 ? options[0] : options[1];

    return (
        <Stack gap={6} miw={{ base: "100%", sm: 180 }} maw={280}>
            <Group justify="space-between" gap="xs" wrap="nowrap">
                <TruncatedText size="xs" c="dimmed" style={{ flex: 1, minWidth: 0 }}>
                    {options[1] ?? ""}
                </TruncatedText>
                <Text size="sm" fw={600} c={color} style={{ flexShrink: 0 }}>
                    {formatSignedScore(score)}
                </Text>
                <TruncatedText size="xs" c="dimmed" ta="right" style={{ flex: 1, minWidth: 0 }}>
                    {options[0] ?? ""}
                </TruncatedText>
            </Group>
            <ScoreMeter
                score={score}
                label={
                    score === 0 ? "Neutral score" : `Score ${formatSignedScore(score)} toward ${toward ?? "option"}`
                }
            />
        </Stack>
    );
}
