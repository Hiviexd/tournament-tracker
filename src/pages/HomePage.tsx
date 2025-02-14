import { useAtom } from "jotai";
import { loggedInUserAtom } from "../store/atoms";
import { useDisclosure } from "@mantine/hooks";
import { Text, Collapse } from "@mantine/core";

export default function HomePage() {
    const [user] = useAtom(loggedInUserAtom);
    const [opened, { toggle }] = useDisclosure(false);

    return (
        <div>
            <Text>{user ? <>Welcome back, {user.username}!</> : "Hello, newcomer!"}</Text>
            <br />
            <Text>pretend this is a complete home page...</Text>
            <br />
            {user?.username === "Hivie" && (
                <a href="#" onClick={toggle}>
                    view loggedInUser object
                </a>
            )}
            <Collapse in={opened}>
                <pre>{JSON.stringify(user, null, 2)}</pre>
            </Collapse>
        </div>
    );
}
