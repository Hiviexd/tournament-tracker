// base
import { Link } from "react-router-dom";

// state
import { useAtom } from "jotai";
import { loggedInUserAtom } from "../../store/atoms";

// Mantine
import { AppShell, Burger, Group, Image, Transition } from "@mantine/core";
import { useWindowScroll } from "@mantine/hooks";

// components
import MainNavigation from "./header/MainNavigation";
import UserMenu from "./header/UserMenu";
import LoginButton from "./buttons/LoginButton";
import SearchButton from "./header/SearchButton";

// hooks

interface IPropTypes {
    mobileHeaderOpened: boolean;
    mobileHeaderToggle: () => void;
}

export default function Header({ mobileHeaderOpened, mobileHeaderToggle }: IPropTypes) {
    const [user] = useAtom(loggedInUserAtom);
    const [scroll] = useWindowScroll();

    const blurState = scroll.y > 5 || mobileHeaderOpened;

    return (
        <AppShell.Header className={`header${blurState ? " scrolled" : ""}`}>
            <style>{`
                @keyframes headerRealLogoSpinY {
                    from {
                        transform: rotateY(0deg);
                    }
                    to {
                        transform: rotateY(360deg);
                    }
                }
            `}</style>
            <Group h="100%" px="xl">
                <div className="nav-group">
                    <Group gap="xl">
                        <Link to="/" style={{ display: "inline-block", lineHeight: 0 }}>
                            <span
                                className="logo-image"
                                style={{
                                    display: "inline-block",
                                    lineHeight: 0,
                                    perspective: "520px",
                                }}>
                                <Image
                                    src="/assets/real-logo.png"
                                    alt="Logo"
                                    style={{
                                        maxWidth: "35px",
                                        maxHeight: "35px",
                                        display: "block",
                                        transformStyle: "preserve-3d",
                                        transformOrigin: "50% 50%",
                                        animation: "headerRealLogoSpinY 1.5s linear infinite",
                                    }}
                                />
                            </span>
                        </Link>
                        <SearchButton visibleFrom="md" />
                    </Group>
                    <Group visibleFrom="md">
                        <MainNavigation user={user} />
                        <UserMenu user={user} />
                    </Group>
                    {/* Mobile */}
                    <Group hiddenFrom="md">
                        <Transition mounted={!mobileHeaderOpened} transition="slide-left" duration={200}>
                            {(styles) => <LoginButton size="xs" style={styles} />}
                        </Transition>
                        <Burger opened={mobileHeaderOpened} onClick={mobileHeaderToggle} size="sm" />
                    </Group>
                </div>
            </Group>
        </AppShell.Header>
    );
}
