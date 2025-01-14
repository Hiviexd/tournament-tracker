import { AppShell, Stack, Divider } from "@mantine/core";
import MobileUserSection from "./header/MobileUserSection";
import MobileNavLinks from "./header/MobileNavLinks";

interface IProps {
    opened: boolean;
}

export default function MobileHeader({ opened }: IProps) {
    if (!opened) return null;

    return (
        <AppShell.Navbar py="md" px={4}>
            <Stack>
                <MobileUserSection />
                <Divider />
                <MobileNavLinks />
            </Stack>
        </AppShell.Navbar>
    );
}
