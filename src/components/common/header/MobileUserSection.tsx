import { useState } from "react";
import { UnstyledButton, Button, Stack, Text, Collapse, Image, Group } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useAtom } from "jotai";
import { loggedInUserAtom } from "../../../store/atoms";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import { Link } from "react-router-dom";
import MobileUserSectionCard from "./MobileUserSectionCard";

interface IProps {
    onClose: () => void;
    onOpenCustomize: () => void;
    onOpenSettings: () => void;
}

export default function MobileUserSection({ onClose, onOpenCustomize, onOpenSettings }: IProps) {
    const [opened, { toggle }] = useDisclosure(false);
    const [user] = useAtom(loggedInUserAtom);
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    const handleLogin = () => {
        setIsLoggingIn(true);
        window.location.href = "/api/auth/login";
    };

    const handleCustomize = () => {
        onClose();
        onOpenCustomize();
    };

    const handleSettings = () => {
        onClose();
        onOpenSettings();
    };

    if (!user)
        return (
            <Button
                onClick={handleLogin}
                variant="gradient"
                loading={isLoggingIn}
                gradient={{ from: "primary.9", to: "primary.4", deg: 45 }}
                leftSection={<Image src="/assets/logo-osu.svg" h={20} />}>
                Login
            </Button>
        );

    return (
        <Stack>
            <MobileUserSectionCard user={user} opened={opened} onClick={toggle} />

            <Collapse in={opened}>
                <Stack px="xs" pb="xs">
                    {/* TODO: uncomment when tournaments are implemented */}
                    {/* <UnstyledButton component={Link} to={`/tournaments?host=${user.osuId}`} onClick={onClose}>
                        <Group>
                            <FontAwesomeIcon icon="trophy" />
                            <Text size="sm">Your Tournaments</Text>
                        </Group>
                    </UnstyledButton> */}

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

                    <UnstyledButton
                        onClick={() => {
                            window.location.href = "/api/auth/logout";
                            onClose();
                        }}>
                        <Group>
                            <FontAwesomeIcon
                                icon="sign-out-alt"
                                color="var(--mantine-color-danger-5)"
                            />
                            <Text size="sm" c="danger">
                                Log Out
                            </Text>
                        </Group>
                    </UnstyledButton>
                </Stack>
            </Collapse>
        </Stack>
    );
}
