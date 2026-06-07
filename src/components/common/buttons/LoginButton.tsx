import { Box, Button, ButtonProps, Tooltip } from "@mantine/core";
import { useState } from "react";
import { useAtom } from "jotai";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { loggedInUserAtom } from "../../../store/atoms";
import { useStatus } from "../../../hooks/useStatus";

function LoginButtonOsuLogo({ size }: { size: number }) {
    return <Box className="login-button-osu-logo" style={{ width: size, height: size }} aria-hidden />;
}

interface IProps extends Omit<
    ButtonProps,
    "onClick" | "loading" | "leftSection" | "rightSection" | "variant" | "gradient"
> {
    size?: "xs" | "sm" | "md" | "lg" | "xl";
    text?: string;
}

export default function LoginButton({ size = "md", text = "Login", ...props }: IProps) {
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [user] = useAtom(loggedInUserAtom);
    const { data: status } = useStatus();
    const isOsuApiDown = status?.osuApi.status === "down";

    const handleLogin = () => {
        setIsLoggingIn(true);
        window.location.href = "/api/auth/login";
    };

    const getIconSize = () => {
        if (size === "xs") return 16;
        if (size === "sm") return 20;
        return 26;
    };

    if (user) return;

    const button = (
        <Button
            onClick={handleLogin}
            variant={isOsuApiDown ? "light" : "gradient"}
            color={isOsuApiDown ? "warning" : undefined}
            loading={isLoggingIn}
            gradient={isOsuApiDown ? undefined : { from: "primary.9", to: "primary.4", deg: 45 }}
            leftSection={<LoginButtonOsuLogo size={getIconSize()} />}
            rightSection={isOsuApiDown ? <FontAwesomeIcon icon="triangle-exclamation" /> : undefined}
            size={size}
            {...props}>
            {text}
        </Button>
    );

    if (isOsuApiDown) {
        return (
            <Tooltip
                multiline
                w={200}
                styles={{ tooltip: { textAlign: "center", textWrap: "pretty" } }}
                label="Login may fail, try again when osu! is back online.">
                {button}
            </Tooltip>
        );
    }

    return button;
}
