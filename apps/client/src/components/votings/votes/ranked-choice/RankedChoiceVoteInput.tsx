import { Radio, Stack, Text, Box, Group } from "@mantine/core";
import { RankedChoiceVote, RankedChoiceVoteScore } from "@tc/types/Vote";

interface IProps {
    value: RankedChoiceVote | null;
    onChange: (vote: RankedChoiceVote | null) => void;
    options: string[];
}

const scoreLabels = [
    { value: -2, label: "Strongly Disagree", color: "red" },
    { value: -1, label: "Disagree", color: "warning" },
    { value: 0, label: "Neutral", color: "gray.6" },
    { value: 1, label: "Agree", color: "success" },
    { value: 2, label: "Strongly Agree", color: "info" },
];

export default function RankedChoiceVoteInput({ value, onChange, options }: IProps) {
    const handleScoreChange = (optionIndex: number, scoreStr: string) => {
        const score = parseInt(scoreStr);
        const currentScores = value?.scores || [];

        // Remove existing score for this option
        const filteredScores = currentScores.filter((s) => s.optionIndex !== optionIndex);

        // Add new score
        const newScores: RankedChoiceVoteScore[] = [...filteredScores, { optionIndex, score }];

        onChange({
            type: "ranked-choice",
            scores: newScores,
        });
    };

    const getScoreForOption = (optionIndex: number): string => {
        const scoreObj = value?.scores?.find((s) => s.optionIndex === optionIndex);
        return scoreObj?.score?.toString() || "0";
    };

    return (
        <Stack gap="lg">
            <Text size="sm" c="dimmed">
                Rate each option from strongly disagree to strongly agree (5-point scale):
            </Text>

            {options.map((option, optionIndex) => (
                <Box key={optionIndex}>
                    <Text fw={500} mb="sm">
                        {option}
                    </Text>
                    <Radio.Group
                        value={getScoreForOption(optionIndex)}
                        onChange={(scoreStr) => handleScoreChange(optionIndex, scoreStr)}>
                        <Group gap="md">
                            {scoreLabels.map(({ value: scoreValue, label, color }) => (
                                <Radio key={scoreValue} value={scoreValue.toString()} label={label} color={color} />
                            ))}
                        </Group>
                    </Radio.Group>
                </Box>
            ))}
        </Stack>
    );
}
