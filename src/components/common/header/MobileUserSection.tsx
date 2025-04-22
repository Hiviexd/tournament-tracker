import { UnstyledButton, Stack, Text, Collapse, Group } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useAtom } from "jotai";
import { loggedInUserAtom } from "../../../store/atoms";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import MobileUserSectionCard from "./MobileUserSectionCard";
import LoginButton from "../LoginButton";

interface IProps {
    onClose: () => void;
    onOpenCustomize: () => void;
    onOpenSettings: () => void;
    onOpenDebug: () => void;
}

export default function MobileUserSection({ onClose, onOpenCustomize, onOpenSettings, onOpenDebug }: IProps) {
    const [opened, { toggle }] = useDisclosure(false);
    const [user] = useAtom(loggedInUserAtom);

    const handleCustomize = () => {
        onClose();
        onOpenCustomize();
    };

    const handleSettings = () => {
        onClose();
        onOpenSettings();
    };

    const handleDebug = () => {
        onClose();
        onOpenDebug();
    };

    if (!user) return <LoginButton />;

    return (
        <Stack>
            <MobileUserSectionCard user={user} opened={opened} onClick={toggle} />

            <Collapse in={opened}>
                <Stack px="xs" pb="xs">
                    <UnstyledButton onClick={handleCustomize}>
                        <Group>
                            <FontAwesomeIcon icon="palette" />
                            <Text size="sm">Customize Theme</Text>
                        </Group>
                    </UnstyledButton>

                    {user.isCommittee && (
                        <UnstyledButton onClick={handleSettings}>
                            <Group>
                                <FontAwesomeIcon icon="cog" />
                                <Text size="sm">Settings</Text>
                            </Group>
                        </UnstyledButton>
                    )}

                    {user.isDev && (
                        <UnstyledButton onClick={handleDebug}>
                            <Group>
                                <FontAwesomeIcon icon="bug" />
                                <Text size="sm">Debug</Text>
                            </Group>
                        </UnstyledButton>
                    )}

                    <UnstyledButton
                        onClick={() => {
                            window.location.href = "/api/auth/logout";
                            onClose();
                        }}>
                        <Group>
                            <FontAwesomeIcon icon="sign-out-alt" color="var(--mantine-color-danger-5)" />
                            <Text size="sm" c="danger.5">
                                Log Out
                            </Text>
                        </Group>
                    </UnstyledButton>
                </Stack>
            </Collapse>
        </Stack>
    );
}
