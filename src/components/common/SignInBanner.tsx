import { Alert, Group } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import LoginButton from "./LoginButton";

interface IProps {
    text?: string;
    hideLoginButton?: boolean;
}

export default function SignInBanner({ text, hideLoginButton = false }: IProps) {
    return (
        <Alert color="danger" title="Sign in required" icon={<FontAwesomeIcon icon="ban" />}>
            <Group justify="space-between" align="center">
                <div>{text || "You need to sign in with your osu! account to use this feature."}</div>
                {!hideLoginButton && <LoginButton size="sm" />}
            </Group>
        </Alert>
    );
}
