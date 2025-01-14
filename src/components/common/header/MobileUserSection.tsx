import { UnstyledButton, Group, Avatar, Stack, Text, Collapse } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useAtom } from "jotai";
import { loggedInUserAtom } from "../../../store/atoms";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link } from "react-router-dom";
import ThemeCustomizeModal from "../ThemeCustomizeModal";
import SettingsModal from "../SettingsModal";

export default function MobileUserSection() {
    const [opened, { toggle }] = useDisclosure(false);
    const [user] = useAtom(loggedInUserAtom);
    const [customizeOpened, { open: openCustomize, close: closeCustomize }] = useDisclosure(false);
    const [settingsOpened, { open: openSettings, close: closeSettings }] = useDisclosure(false);

    if (!user) return null;

    return (
        <Stack>
            <ThemeCustomizeModal opened={customizeOpened} onClose={closeCustomize} />
            <SettingsModal opened={settingsOpened} onClose={closeSettings} />
            <UnstyledButton onClick={toggle}>
                <Group p="xs">
                    <Avatar src={user.avatarUrl} size="md" />
                    <Stack gap={2} style={{ flex: 1 }}>
                        <Text size="sm" fw={500}>
                            {user.username}
                        </Text>
                    </Stack>
                    <FontAwesomeIcon
                        icon="caret-down"
                        style={{
                            transform: opened ? "rotate(180deg)" : "none",
                            transition: "transform 200ms ease",
                        }}
                    />
                </Group>
            </UnstyledButton>

            <Collapse in={opened}>
                <Stack px="xs" pb="xs">
                    <UnstyledButton component={Link} to="/tournaments">
                        <Group>
                            <FontAwesomeIcon icon="trophy" />
                            <Text size="sm">Your Tournaments</Text>
                        </Group>
                    </UnstyledButton>

                    <UnstyledButton onClick={openCustomize}>
                        <Group>
                            <FontAwesomeIcon icon="palette" />
                            <Text size="sm">Customize Theme</Text>
                        </Group>
                    </UnstyledButton>

                    {user.isCommittee && (
                        <UnstyledButton onClick={openSettings}>
                            <Group>
                                <FontAwesomeIcon icon="cog" />
                                <Text size="sm">Settings</Text>
                            </Group>
                        </UnstyledButton>
                    )}

                    <UnstyledButton onClick={() => (window.location.href = "/api/auth/logout")}>
                        <Group>
                            <FontAwesomeIcon icon="sign-out-alt" />
                            <Text size="sm" c="red">
                                Log Out
                            </Text>
                        </Group>
                    </UnstyledButton>
                </Stack>
            </Collapse>
        </Stack>
    );
}
