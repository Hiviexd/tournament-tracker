import { UnstyledButton, Stack, Text, Collapse, Group } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useAtom } from "jotai";
import { loggedInUserAtom } from "../../../store/atoms";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import MobileUserSectionCard from "./MobileUserSectionCard";
import LoginButton from "../buttons/LoginButton";
import { useNavigate } from "react-router-dom";
import utils from "../../../../utils";

interface IProps {
    onClose: () => void;
    onOpenCustomize: () => void;
    onOpenSettings: () => void;
    onOpenDebug: () => void;
}

export default function MobileUserSection({ onClose, onOpenCustomize, onOpenSettings, onOpenDebug }: IProps) {
    const [opened, { toggle }] = useDisclosure(false);
    const [user] = useAtom(loggedInUserAtom);

    const navigate = useNavigate();

    const handleDashboard = () => {
        onClose();
        navigate("/dashboard");
    };

    const handleYourTournaments = () => {
        onClose();
        navigate(`/tournaments?host=${user?.osuId}`);
    };

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
                    {user.isCommittee && (
                        <UnstyledButton onClick={handleDashboard}>
                            <Group>
                                <FontAwesomeIcon icon="table-columns" />
                                <Text size="sm">Dashboard</Text>
                            </Group>
                        </UnstyledButton>
                    )}

                    <UnstyledButton onClick={handleYourTournaments}>
                        <Group>
                            <FontAwesomeIcon icon="trophy" />
                            <Text size="sm">Your Tournaments</Text>
                        </Group>
                    </UnstyledButton>

                    <UnstyledButton onClick={handleCustomize}>
                        <Group>
                            <FontAwesomeIcon icon="palette" />
                            <Text size="sm">Customize Theme</Text>
                        </Group>
                    </UnstyledButton>

                    <UnstyledButton onClick={handleSettings}>
                        <Group>
                            <FontAwesomeIcon icon="cog" />
                            <Text size="sm">Settings</Text>
                        </Group>
                    </UnstyledButton>

                    {user.isDev && (
                        <UnstyledButton onClick={handleDebug}>
                            <Group>
                                <FontAwesomeIcon icon="bug" />
                                <Text size="sm">Debug</Text>
                            </Group>
                        </UnstyledButton>
                    )}

                    <UnstyledButton
                        onClick={async () => {
                            await utils.apiCall({
                                method: "post",
                                url: "/api/auth/logout",
                            });
                            onClose();
                            window.location.href = "/";
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
