import { Box } from "@mantine/core";
import { formatSignedScore, getScoreColor } from "./voteScoreColor";

interface IProps {
    score: number;
    min?: number;
    max?: number;
    label?: string;
}

export default function ScoreMeter({ score, min = -5, max = 5, label }: IProps) {
    const color = getScoreColor(score);
    const range = max - min;
    const zeroPct = ((0 - min) / range) * 100;
    const leftPct = score >= 0 ? zeroPct : ((score - min) / range) * 100;
    const widthPct = (Math.abs(score) / range) * 100;

    return (
        <Box
            h={8}
            bg="dark.5"
            pos="relative"
            style={{ borderRadius: 999 }}
            role="meter"
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={score}
            aria-label={label ?? (score === 0 ? "Neutral score" : `Score ${formatSignedScore(score)}`)}>
            <Box pos="absolute" left={`${zeroPct}%`} top={0} bottom={0} w={1} bg="dark.3" />
            {score !== 0 && (
                <Box
                    pos="absolute"
                    top={0}
                    bottom={0}
                    bg={color}
                    style={{ left: `${leftPct}%`, width: `${widthPct}%`, borderRadius: 999 }}
                />
            )}
        </Box>
    );
}
