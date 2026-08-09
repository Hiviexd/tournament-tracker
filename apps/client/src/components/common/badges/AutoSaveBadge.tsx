import { ThemeIcon, Transition } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface AutoSaveBadgeProps {
    isVisible: boolean;
    transitionDuration?: number;
}

export default function AutoSaveBadge({ isVisible, transitionDuration = 200 }: AutoSaveBadgeProps) {
    return (
        <Transition mounted={isVisible} transition="fade" duration={transitionDuration} timingFunction="ease">
            {(styles) => (
                <ThemeIcon variant="light" color="green" mr={3} style={styles}>
                    <FontAwesomeIcon icon="floppy-disk" />
                </ThemeIcon>
            )}
        </Transition>
    );
}
