import { AppShell, Stack, Divider, Transition } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import MobileUserSection from "./header/MobileUserSection";
import MobileNavigation from "./header/MobileNavigation";
import ThemeCustomizeModal from "../modals/ThemeCustomizeModal";
import SettingsModal from "../modals/SettingsModal";
import DebugModal from "../modals/DebugModal";

interface IProps {
    opened: boolean;
    onClose: () => void;
}

export default function MobileHeader({ opened, onClose }: IProps) {
    const [customizeOpened, { open: openCustomize, close: closeCustomize }] = useDisclosure(false);
    const [settingsOpened, { open: openSettings, close: closeSettings }] = useDisclosure(false);
    const [debugOpened, { open: openDebug, close: closeDebug }] = useDisclosure(false);
    return (
        <>
            <ThemeCustomizeModal opened={customizeOpened} onClose={closeCustomize} />
            <SettingsModal opened={settingsOpened} onClose={closeSettings} />
            <DebugModal opened={debugOpened} onClose={closeDebug} />

            <Transition mounted={opened} transition="slide-left" duration={200}>
                {(styles) => (
                    <AppShell.Navbar py="md" px="md" hiddenFrom="md" style={styles}>
                        <AppShell.Section grow>
                            <Stack gap="md">
                                <MobileUserSection
                                    onClose={onClose}
                                    onOpenCustomize={openCustomize}
                                    onOpenSettings={openSettings}
                                    onOpenDebug={openDebug}
                                />
                                <Divider />
                                <MobileNavigation onClose={onClose} />
                            </Stack>
                        </AppShell.Section>
                    </AppShell.Navbar>
                )}
            </Transition>
        </>
    );
}
