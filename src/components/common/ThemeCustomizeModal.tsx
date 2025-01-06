import { Modal, Stack, Group, Button } from "@mantine/core";
import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { updateHue } from "../../themes/main";
import { HueSlider, ColorSwatch, Checkbox, Divider } from "@mantine/core";

interface IProps {
    opened: boolean;
    onClose: () => void;
}

export default function ThemeCustomizeModal({ opened, onClose }: IProps) {
    const [initialHue, setInitialHue] = useState(45);
    const [newHue, setNewHue] = useState(initialHue);
    const [isGreyscale, setIsGreyscale] = useState(false);

    useEffect(() => {
        const primaryHue = localStorage.getItem("primary-color-hue");
        const isGreyscale = localStorage.getItem("greyscale");
        if (primaryHue) {
            setInitialHue(Number(primaryHue));
            setNewHue(Number(primaryHue));
            setIsGreyscale(isGreyscale === "true");
        }
    }, []);

    const getPreviewColor = (hue: number, isGreyscale: boolean) => {
        if (isGreyscale) return "#656565";
        return `hsl(${hue}, 70%, 50%)`;
    };

    const handleSubmit = () => {
        updateHue(newHue, isGreyscale);
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
                <Divider />
                <HueSlider value={newHue} onChange={(value) => setNewHue(value)} />
                <Checkbox
                    label="Greyscale"
                    checked={isGreyscale}
                    onChange={(event) => setIsGreyscale(event.currentTarget.checked)}
                />
                <ColorSwatch w="100%" color={getPreviewColor(newHue, isGreyscale)} />

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
                        disabled={
                            initialHue === newHue &&
                            isGreyscale === (localStorage.getItem("greyscale") === "true")
                        }
                        leftSection={<FontAwesomeIcon icon="palette" />}>
                        Apply Theme
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
}
