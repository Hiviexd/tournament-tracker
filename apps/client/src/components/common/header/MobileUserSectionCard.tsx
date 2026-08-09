import { UnstyledButton, Group } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IUser } from "@tc/types/User";
import UserDisplay from "../UserDisplay";

interface IProps {
    user: IUser;
    opened: boolean;
    onClick: () => void;
}

export default function MobileUserSectionCard({ user, opened, onClick }: IProps) {
    return (
        <UnstyledButton onClick={onClick}>
            <Group
                p="md"
                style={{
                    position: "relative",
                    overflow: "hidden",
                    borderRadius: "var(--mantine-radius-md)",
                }}>
                {/* cover background */}
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundImage: `url(${user.coverUrl})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        filter: "brightness(0.4)",
                        zIndex: 0,
                    }}
                />

                {/* content */}
                <div style={{ position: "relative", zIndex: 1, width: "100%" }}>
                    <Group justify="space-between" align="center">
                        <UserDisplay user={user} showCountryFlag />
                        <FontAwesomeIcon
                            icon="caret-down"
                            style={{
                                transform: opened ? "rotate(180deg)" : "none",
                                transition: "transform 200ms ease",
                                color: "white",
                            }}
                        />
                    </Group>
                </div>
            </Group>
        </UnstyledButton>
    );
}
