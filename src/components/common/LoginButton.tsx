import { Button, Image, ButtonProps } from "@mantine/core";
import { useState } from "react";

interface IProps extends Omit<ButtonProps, "onClick" | "loading" | "leftSection" | "variant" | "gradient"> {
    size?: "sm" | "md" | "lg";
    text?: string;
}

export default function LoginButton({ size = "md", text = "Sign In", ...props }: IProps) {
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    const handleLogin = () => {
        setIsLoggingIn(true);
        window.location.href = "/api/auth/login";
    };

    return (
        <Button
            onClick={handleLogin}
            variant="gradient"
            loading={isLoggingIn}
            gradient={{ from: "primary.9", to: "primary.4", deg: 45 }}
            leftSection={<Image src="/assets/logo-osu.svg" h={size === "sm" ? 20 : 26} />}
            size={size}
            {...props}>
            {text}
        </Button>
    );
}
