import { Text } from "@mantine/core";

interface IProps {
    length: number;
    maxLength: number;
    size?: "xs" | "sm" | "md";
}

export default function TextLengthIndicator({ length, maxLength, size = "xs" }: IProps) {
    const getColor = () => {
        if (length > maxLength) return "danger";
        return "dimmed";
    };

    return (
        <Text size={size} c={getColor()}>
            {length}/{maxLength}
        </Text>
    );
}
