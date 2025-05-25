import { Radio, Stack, Text } from "@mantine/core";
import { BinaryStrictVote } from "../../../../interfaces/Vote";

interface IProps {
    value: BinaryStrictVote | null;
    onChange: (vote: BinaryStrictVote | null) => void;
    options: string[];
    allowNeutralVotes?: boolean;
}

export default function BinaryStrictVoteInput({ value, onChange, allowNeutralVotes = true }: IProps) {
    const handleChange = (scoreStr: string) => {
        const score = parseInt(scoreStr);
        onChange({
            type: "binary-strict",
            score,
        });
    };

    return (
        <Stack gap="md">
            <Text size="sm" c="dimmed">
                Select your position on this vote:
            </Text>
            <Radio.Group value={value?.score?.toString() || ""} onChange={handleChange}>
                <Stack gap="xs">
                    <Radio value="1" label="Agree" color="success" />
                    {allowNeutralVotes && <Radio value="0" label="Neutral" color="yellow" />}
                    <Radio value="-1" label="Disagree" color="red" />
                </Stack>
            </Radio.Group>
        </Stack>
    );
}
