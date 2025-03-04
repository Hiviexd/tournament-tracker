import { Badge, Transition } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface AutoSaveBadgeProps {
    isVisible: boolean;
    transitionDuration?: number;
}

/**
 * Badge component that shows "Saved" status with a transition effect
 */
export default function AutoSaveBadge({ isVisible, transitionDuration = 200 }: AutoSaveBadgeProps) {
    return (
        <Transition mounted={isVisible} transition="fade" duration={transitionDuration} timingFunction="ease">
            {(styles) => (
                <Badge
                    size="sm"
                    variant="light"
                    color="success"
                    style={{ ...styles }}
                    leftSection={<FontAwesomeIcon icon="floppy-disk" size="xs" />}>
                    Saved
                </Badge>
            )}
        </Transition>
    );
}
