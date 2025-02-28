import { useState } from "react";
import { Menu, Avatar } from "@mantine/core";
// import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useHover, useDisclosure } from "@mantine/hooks";
import { IUser } from "../../../../interfaces/User";
import ThemeCustomizeModal from "../modals/ThemeCustomizeModal";
import SettingsModal from "../modals/SettingsModal";
import LoginButton from "../LoginButton";

interface IProps {
    user: IUser | null;
}

export default function UserMenu({ user }: IProps) {
    const [menuOpened, setMenuOpened] = useState(false);
    const { hovered, ref } = useHover();
    const [customizeOpened, { open: openCustomize, close: closeCustomize }] = useDisclosure(false);
    const [settingsOpened, { open: openSettings, close: closeSettings }] = useDisclosure(false);

    if (!user) return <LoginButton size="sm" />;

    return (
        <>
            <ThemeCustomizeModal opened={customizeOpened} onClose={closeCustomize} />
            <SettingsModal opened={settingsOpened} onClose={closeSettings} />

            <Menu withArrow shadow="md" trigger="hover" opened={menuOpened} onChange={setMenuOpened}>
                <Menu.Target>
                    <Avatar
                        ref={ref}
                        src={user.avatarUrl}
                        size="3rem"
                        className="user-avatar"
                        style={{
                            borderColor: hovered || menuOpened ? "var(--mantine-color-primary-4)" : "transparent",
                        }}
                    />
                </Menu.Target>
                <Menu.Dropdown>
                    <Menu.Label>Welcome back, {user.username}!</Menu.Label>
                    {/* TODO: uncomment when tournaments are implemented */}
                    {/* <Menu.Item
                        component={Link}
                        to={`/tournaments?host=${user.osuId}`}
                        leftSection={<FontAwesomeIcon icon="trophy" />}>
                        Your Tournaments
                    </Menu.Item> */}
                    <Menu.Item onClick={openCustomize} leftSection={<FontAwesomeIcon icon="palette" />}>
                        Customize Theme
                    </Menu.Item>
                    {user.isCommittee && (
                        <Menu.Item onClick={openSettings} leftSection={<FontAwesomeIcon icon="cog" />}>
                            Settings
                        </Menu.Item>
                    )}
                    <Menu.Divider />
                    <Menu.Item
                        onClick={() => {
                            window.location.href = "/api/auth/logout";
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
