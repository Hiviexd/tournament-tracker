import { Modal, Stack, TextInput, Group, Button } from "@mantine/core";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { updatePrimaryColor } from "../../themes/main";

interface IProps {
    opened: boolean;
    onClose: () => void;
}

export default function ThemeCustomizeModal({ opened, onClose }: IProps) {
    const [color, setColor] = useState("");

    const handleSubmit = () => {
        if (/^#[0-9A-F]{6}$/i.test(color)) {
            updatePrimaryColor(color);
        }
    };

    const handleReset = () => {
        localStorage.removeItem("primary-color");
        window.location.reload();
    };

    return (
        <Modal opened={opened} onClose={onClose} title="Customize Theme" size="sm">
            <Stack>
                <TextInput
                    value={color}
                    onChange={(e) => setColor(e.currentTarget.value)}
                    placeholder="#000000"
                    label="Primary Color"
                    description="Enter a hex color code"
                    error={color && !/^#[0-9A-F]{6}$/i.test(color) ? "Invalid hex color" : null}
                    leftSection={<FontAwesomeIcon icon="palette" />}
                />

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
                        disabled={!color || !/^#[0-9A-F]{6}$/i.test(color)}
                        leftSection={<FontAwesomeIcon icon="check" />}>
                        Apply Theme
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
}
