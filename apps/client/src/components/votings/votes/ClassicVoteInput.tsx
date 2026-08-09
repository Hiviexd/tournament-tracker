import { Stack, Radio } from "@mantine/core";

interface IProps {
    options: string[];
    value: number;
    onChange: (value: number) => void;
}

export default function ClassicVoteInput({ options, value, onChange }: IProps) {
    return (
        <Radio.Group
            value={value.toString()}
            onChange={(value) => onChange(Number(value))}
            label="Select your option"
            withAsterisk>
            <Stack gap="xs">
                {options.map((option, index) => (
                    <Radio key={index} value={index.toString()} label={option} />
                ))}
            </Stack>
        </Radio.Group>
    );
}
