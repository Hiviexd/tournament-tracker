import { Stack, Group, Text, Slider } from "@mantine/core";

interface IProps {
    options: [string, string]; // Exactly 2 options for binary votes
    value: number;
    onChange: (value: number) => void;
}

export default function BinaryVoteInput({ options, value, onChange }: IProps) {
    return (
        <Stack gap="xs">
            <Group justify="space-between">
                <Text>{options[1]}</Text>
                <Text>{options[0]}</Text>
            </Group>
            <Slider
                value={value}
                onChange={onChange}
                min={-5}
                max={5}
                step={1}
                marks={[
                    { value: -5, label: "-5" },
                    { value: 0, label: "0" },
                    { value: 5, label: "5" },
                ]}
            />
        </Stack>
    );
}
