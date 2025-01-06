import { Modal, Stack, Group, Button } from "@mantine/core";
import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { updateHue } from "../../themes/main";
import { HueSlider } from "@mantine/core";

interface IProps {
    opened: boolean;
    onClose: () => void;
}

export default function ThemeCustomizeModal({ opened, onClose }: IProps) {
    const [initialHue, setInitialHue] = useState(45);
    const [newHue, setNewHue] = useState(initialHue);

    useEffect(() => {
        const primaryHue = localStorage.getItem("primary-color-hue");
        if (primaryHue) {
            setInitialHue(Number(primaryHue));
            setNewHue(Number(primaryHue));
        }
    }, []);

    const handleSubmit = () => {
        updateHue(newHue);
    };

    const handleReset = () => {
        localStorage.removeItem("primary-color");
        localStorage.removeItem("primary-color-hue");
        localStorage.removeItem("secondary-color");
        localStorage.removeItem("secondary-color-hue");
        window.location.reload();
    };

    return (
        <Modal opened={opened} onClose={onClose} title="Customize Theme" size="sm">
            <Stack>
                <HueSlider value={newHue} onChange={(value) => setNewHue(value)} />

                <Group justify="space-between">
                    <Button
                        variant="subtle"
                        color="danger"
                        onClick={handleReset}
                        leftSection={<FontAwesomeIcon icon="undo" />}>
                        Reset to Default
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={initialHue === newHue}
                        leftSection={<FontAwesomeIcon icon="palette" />}>
                        Apply Theme
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
}
