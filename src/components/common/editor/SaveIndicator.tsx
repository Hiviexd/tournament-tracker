import { Badge, Transition } from "@mantine/core";

interface SaveIndicatorProps {
    isVisible: boolean;
    transitionDuration?: number;
}

/**
 * A component that displays a "Saved" badge with smooth transitions
 */
export default function SaveIndicator({ isVisible, transitionDuration = 400 }: SaveIndicatorProps) {
    return (
        <Transition mounted={isVisible} transition="fade" duration={transitionDuration}>
            {(styles) => (
                <Badge color="green" size="xs" variant="light" style={styles}>
                    Saved
                </Badge>
            )}
        </Transition>
    );
}
