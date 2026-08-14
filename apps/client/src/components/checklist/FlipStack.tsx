import { Stack, StackProps } from "@mantine/core";
import { useFlipMove } from "../../hooks/useFlipMove";

export default function FlipStack(props: StackProps) {
    const ref = useFlipMove();
    return <Stack {...props} ref={ref} />;
}
