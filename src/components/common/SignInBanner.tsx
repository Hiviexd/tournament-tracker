import { Alert, Group } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import LoginButton from "./LoginButton";

export default function SignInBanner() {
    return (
        <Alert color="danger" title="Sign in required" icon={<FontAwesomeIcon icon="ban" />}>
            <Group justify="space-between" align="center">
                <div>You need to sign in with your osu! account to submit tickets or reports.</div>
                <LoginButton size="sm" />
            </Group>
        </Alert>
    );
}
