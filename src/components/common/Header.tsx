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
import { getSavedPreference } from "../../hooks/useLocalPreferences";
import { DEFAULT_HUE } from "../../constants";

interface IPropTypes {
    mobileHeaderOpened: boolean;
    mobileHeaderToggle: () => void;
}

export default function Header({ mobileHeaderOpened, mobileHeaderToggle }: IPropTypes) {
    const [user] = useAtom(loggedInUserAtom);
    const [scroll] = useWindowScroll();
    let hue = getSavedPreference<number>("hue", Number(DEFAULT_HUE));
    const isGreyscale = getSavedPreference<boolean>("greyscale", false);

    // For colorblind modes, use the same colors as the actual themes
    const colorblindMode = getSavedPreference<"none" | "deuteranopia" | "protanopia" | "tritanopia">(
        "colorblindMode",
        "none"
    );

    if (colorblindMode !== "none") {
        if (colorblindMode === "tritanopia") {
            hue = 330;
        } else {
            hue = 200;
        }
    }

    const blurState = scroll.y > 5 || mobileHeaderOpened;

    return (
        <AppShell.Header className={`header${blurState ? " scrolled" : ""}`}>
            <div
                className={`header-triangles-bg${isGreyscale ? " greyscale" : ""}`}
                style={{ "--primary-hue": hue + "deg" } as React.CSSProperties}
            />
            <Group h="100%" px="xl">
                <div className="nav-group">
                    <Link to="/">
                        <Image
                            src="/assets/logo-main.svg?20250714"
                            alt="Logo"
                            className="logo-image"
                            style={{ maxWidth: "35px", maxHeight: "35px" }}
                        />
                    </Link>
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
