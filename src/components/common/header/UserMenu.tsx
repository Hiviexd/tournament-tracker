import { useState } from "react";
import { Menu, Avatar, Box } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useHover, useDisclosure } from "@mantine/hooks";
import { IUser } from "../../../../interfaces/User";
import ThemeCustomizeModal from "../../modals/ThemeCustomizeModal";
import SettingsModal from "../../modals/SettingsModal";
import LoginButton from "../buttons/LoginButton";
import DebugModal from "../../modals/DebugModal";
import { Link } from "react-router-dom";
import utils from "../../../../utils";

interface IProps {
    user: IUser | null;
}

export default function UserMenu({ user }: IProps) {
    const [menuOpened, setMenuOpened] = useState(false);
    const { hovered, ref } = useHover();
    const [customizeOpened, { open: openCustomize, close: closeCustomize }] = useDisclosure(false);
    const [settingsOpened, { open: openSettings, close: closeSettings }] = useDisclosure(false);
    const [debugOpened, { open: openDebug, close: closeDebug }] = useDisclosure(false);

    if (!user) return <LoginButton size="sm" />;

    return (
        <>
            <ThemeCustomizeModal opened={customizeOpened} onClose={closeCustomize} />
            <SettingsModal opened={settingsOpened} onClose={closeSettings} />
            <DebugModal opened={debugOpened} onClose={closeDebug} />

            <Menu withArrow shadow="md" trigger="hover" opened={menuOpened} onChange={setMenuOpened}>
                <Menu.Target>
                    <Box
                        ref={ref}
                        component="span"
                        className="animation-spin"
                        display="inline-block"
                        style={{ lineHeight: 0 }}>
                        <Avatar
                            src={user.avatarUrl}
                            size="3rem"
                            className="user-avatar"
                            style={{
                                borderColor: hovered || menuOpened ? "var(--mantine-color-primary-4)" : "transparent",
                            }}
                        />
                    </Box>
                </Menu.Target>
                <Menu.Dropdown>
                    <Menu.Label>Welcome back, {user.username}!</Menu.Label>
                    {user.isCommittee && (
                        <Menu.Item
                            component={Link}
                            to="/dashboard"
                            leftSection={<FontAwesomeIcon icon="table-columns" />}>
                            Dashboard
                        </Menu.Item>
                    )}
                    <Menu.Item
                        component={Link}
                        to={`/tournaments?host=${user.osuId}`}
                        leftSection={<FontAwesomeIcon icon="trophy" />}>
                        Your Tournaments
                    </Menu.Item>
                    {user.isCommittee && <Menu.Divider />}
                    <Menu.Item onClick={openCustomize} leftSection={<FontAwesomeIcon icon="palette" />}>
                        Customize Theme
                    </Menu.Item>
                    <Menu.Item onClick={openSettings} leftSection={<FontAwesomeIcon icon="cog" />}>
                        Settings
                    </Menu.Item>
                    {user.isDev && (
                        <Menu.Item onClick={openDebug} leftSection={<FontAwesomeIcon icon="bug" />}>
                            Debug
                        </Menu.Item>
                    )}
                    <Menu.Divider />
                    <Menu.Item
                        onClick={async () => {
                            await utils.apiCall({
                                method: "post",
                                url: "/api/auth/logout",
                            });
                            window.location.href = "/";
                        }}
                        color="danger"
                        leftSection={<FontAwesomeIcon icon="sign-out-alt" />}>
                        Log Out
                    </Menu.Item>
                </Menu.Dropdown>
            </Menu>
        </>
    );
}
