import { Modal, Stack, Group, Button, Text, Alert, Switch } from "@mantine/core";
import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { updateTheme } from "../../themes";
import { HueSlider, Checkbox, Divider, Select } from "@mantine/core";
import { DEFAULT_HUE, COLORBLIND_MODES, ColorblindMode, DEFAULT_COLORBLIND_MODE } from "../../constants";
import { useLocalPreference } from "../../hooks/useLocalPreferences";
import { useSetAtom } from "jotai";
import { seasonalEffectsAtom } from "../../store/atoms";

interface IProps {
    opened: boolean;
    onClose: () => void;
}

export default function ThemeCustomizeModal({ opened, onClose }: IProps) {
    const [hue, setHue] = useLocalPreference<number>("hue", Number(DEFAULT_HUE));
    const [isGreyscale, setIsGreyscale] = useLocalPreference<boolean>("greyscale", false);
    const [colorblindMode, setColorblindMode] = useLocalPreference<ColorblindMode>(
        "colorblindMode",
        DEFAULT_COLORBLIND_MODE
    );

    const [initialHue, setInitialHue] = useState(Number(DEFAULT_HUE));
    const [initialIsGreyscale, setInitialIsGreyscale] = useState(false);
    const [initialColorblindMode, setInitialColorblindMode] = useState<ColorblindMode>(DEFAULT_COLORBLIND_MODE);

    const [seasonalEffects, setSeasonalEffects] = useLocalPreference<boolean>("seasonal_effects", true);
    const setSeasonalEffectsAtom = useSetAtom(seasonalEffectsAtom);

    useEffect(() => {
        // Set initial values for comparison only when modal opens
        if (opened) {
            setInitialHue(hue);
            setInitialIsGreyscale(isGreyscale);
            setInitialColorblindMode(colorblindMode);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [opened]);

    const isColorblindMode = colorblindMode !== "none";

    const handleSubmit = () => {
        if (isColorblindMode) {
            // For colorblind themes, only pass the colorblind mode
            updateTheme(undefined, undefined, colorblindMode);
        } else {
            // For normal theme, pass hue and greyscale
            updateTheme(hue, isGreyscale, colorblindMode);
        }
    };

    const handleReset = () => {
        setHue(Number(DEFAULT_HUE));
        setIsGreyscale(false);
        setColorblindMode(DEFAULT_COLORBLIND_MODE);
        // Small delay to ensure state updates before reload
        setTimeout(() => {
            window.location.reload();
        }, 100);
    };

    const hasChanges = () => {
        if (isColorblindMode) {
            // For colorblind modes, only check if colorblind mode changed
            return initialColorblindMode !== colorblindMode;
        } else {
            // For normal mode, check all settings
            return initialHue !== hue || initialIsGreyscale !== isGreyscale || initialColorblindMode !== colorblindMode;
        }
    };

    const handleSeasonalEffectsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSeasonalEffects(event.currentTarget.checked);
        setSeasonalEffectsAtom(event.currentTarget.checked);
    };

    return (
        <Modal opened={opened} onClose={onClose} title="Customize Theme" size="md">
            <Stack>
                <Divider />

                {/* Seasonal Effects */}
                <Group justify="space-between">
                    <div>
                        <Text size="sm" fw={500}>
                            Seasonal Effects
                        </Text>
                        <Text size="xs" c="dimmed">
                            Enable seasonal effects on the website (December snow, etc.)
                        </Text>
                    </div>
                    <Switch checked={seasonalEffects} onChange={handleSeasonalEffectsChange} />
                </Group>

                {/* Colorblind Mode Selection */}
                <Select
                    label="Color Vision Accessibility"
                    description="Select your color vision type for optimal color differentiation"
                    placeholder="Choose accessibility mode"
                    value={colorblindMode}
                    onChange={(value) => setColorblindMode(value as ColorblindMode)}
                    data={Object.entries(COLORBLIND_MODES).map(([key, label]) => ({
                        value: key,
                        label,
                    }))}
                />

                {/* Theme Customization - Only show for normal vision */}
                {!isColorblindMode && (
                    <Stack gap="sm">
                        <Text size="sm" fw={500}>
                            Theme Colors
                        </Text>
                        <HueSlider value={hue} onChange={(value) => setHue(value)} />
                        <Checkbox
                            label="Greyscale mode"
                            checked={isGreyscale}
                            onChange={(event) => setIsGreyscale(event.currentTarget.checked)}
                        />
                    </Stack>
                )}

                {/* Colorblind Mode Info */}
                {isColorblindMode && (
                    <Alert
                        icon={<FontAwesomeIcon icon="info-circle" />}
                        color="blue"
                        variant="light"
                        title={`${COLORBLIND_MODES[colorblindMode]} theme selected`}>
                        <Text size="sm">Hue and greyscale customization are disabled to maintain accessibility.</Text>
                    </Alert>
                )}

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
                        disabled={!hasChanges()}
                        leftSection={<FontAwesomeIcon icon="palette" />}>
                        Apply Theme
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
}
