import { AppShell, Stack, Divider, Transition } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import MobileUserSection from "./header/MobileUserSection";
import MobileNavigation from "./header/MobileNavigation";
import ThemeCustomizeModal from "./ThemeCustomizeModal";
import SettingsModal from "./SettingsModal";

interface IProps {
    opened: boolean;
    onClose: () => void;
}

export default function MobileHeader({ opened, onClose }: IProps) {
    const [customizeOpened, { open: openCustomize, close: closeCustomize }] = useDisclosure(false);
    const [settingsOpened, { open: openSettings, close: closeSettings }] = useDisclosure(false);

    return (
        <>
            <ThemeCustomizeModal opened={customizeOpened} onClose={closeCustomize} />
            <SettingsModal opened={settingsOpened} onClose={closeSettings} />

            <Transition mounted={opened} transition="slide-right" duration={200}>
                {(styles) => (
                    <AppShell.Navbar py="md" px="md" hiddenFrom="sm" style={styles}>
                        <AppShell.Section grow>
                            <Stack gap="md">
                                <MobileUserSection
                                    onClose={onClose}
                                    onOpenCustomize={openCustomize}
                                    onOpenSettings={openSettings}
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
