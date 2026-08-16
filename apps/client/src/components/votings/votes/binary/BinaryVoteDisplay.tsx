import { Box, Group, Stack, Text } from "@mantine/core";
import { TruncatedText } from "../../../common/TruncatedText";
import { formatSignedScore, getScoreColor } from "../voteScoreColor";

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
            <Box
                h={8}
                bg="dark.5"
                pos="relative"
                style={{ borderRadius: 999 }}
                role="meter"
                aria-valuemin={-5}
                aria-valuemax={5}
                aria-valuenow={score}
                aria-label={
                    score === 0 ? "Neutral score" : `Score ${formatSignedScore(score)} toward ${toward ?? "option"}`
                }>
                <Box pos="absolute" left="50%" top={0} bottom={0} w={1} bg="dark.3" />
                {score !== 0 && (
                    <Box
                        pos="absolute"
                        top={0}
                        bottom={0}
                        bg={color}
                        style={{
                            left: `${score >= 0 ? 50 : ((score + 5) / 10) * 100}%`,
                            width: `${(Math.abs(score) / 10) * 100}%`,
                            borderRadius: 999,
                        }}
                    />
                )}
            </Box>
        </Stack>
    );
}
