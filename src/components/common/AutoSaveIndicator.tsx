import { Transition } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface IProps {
    isSaved: boolean;
    duration?: number;
}

export default function AutoSaveIndicator({ isSaved, duration = 150 }: IProps) {
    return (
        <Transition mounted={isSaved} transition="fade" duration={duration}>
            {(styles) => (
                <FontAwesomeIcon
                    icon="floppy-disk"
                    size="sm"
                    style={{
                        ...styles,
                        color: "var(--mantine-color-info-6)",
                    }}
                />
            )}
        </Transition>
    );
}