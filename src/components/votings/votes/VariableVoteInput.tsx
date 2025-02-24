import { Stack, Text, Slider } from "@mantine/core";

interface IProps {
    options: string[];
    values: Array<{ optionIndex: number; score: number }>;
    onChange: (optionIndex: number, score: number) => void;
}

export default function VariableVoteInput({ options, values, onChange }: IProps) {
    return (
        <Stack gap="md">
            {options.map((option, index) => (
                <Stack key={index} gap="xs">
                    <Text size="sm">{option}</Text>
                    <Slider
                        value={values.find((v) => v.optionIndex === index)?.score ?? 0}
                        onChange={(value) => onChange(index, value)}
                        min={-5}
                        max={5}
                        step={1}
                        marks={[
                            { value: -5, label: "-5" },
                            { value: 0, label: "0" },
                            { value: 5, label: "5" },
                        ]}
                        labelTransitionProps={{
                            transition: "fade",
                            duration: 150,
                            timingFunction: "ease-out",
                        }}
                    />
                </Stack>
            ))}
        </Stack>
    );
}
