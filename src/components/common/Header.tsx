// base
import { Link } from "react-router-dom";

// state
import { useAtom } from "jotai";
import { loggedInUserAtom } from "../../store/atoms";

// Mantine
import { AppShell, Burger, Group, Image } from "@mantine/core";

// components
import MainNavigation from "./header/MainNavigation";
import UserMenu from "./header/UserMenu";

interface IPropTypes {
    mobileHeaderOpened: boolean;
    mobileHeaderToggle: () => void;
}

export default function Header({ mobileHeaderOpened, mobileHeaderToggle }: IPropTypes) {
    const [user] = useAtom(loggedInUserAtom);

    return (
        <header>
            <AppShell.Header>
                <Group h="100%" px="xl">
                    <div className="nav-group">
                        <Link to="/">
                            <Image src="/assets/logo-main.svg" alt="Logo" h={40} />
                        </Link>
                        <Group visibleFrom="md">
                            {user && <MainNavigation user={user} />}
                            <UserMenu user={user} />
                        </Group>
                        <Burger
                            opened={mobileHeaderOpened}
                            onClick={mobileHeaderToggle}
                            hiddenFrom="md"
                            size="sm"
                        />
                    </div>
                </Group>
            </AppShell.Header>
        </header>
    );
}
