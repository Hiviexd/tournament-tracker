import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    Button,
    Group,
    Text,
    CopyButton as MantineCopyButton,
    type ButtonVariant,
    type DefaultMantineColor,
    type DefaultMantineSize,
} from "@mantine/core";

interface IProps {
    value: string;
    color?: DefaultMantineColor;
    text?: string;
    size?: DefaultMantineSize;
    variant?: ButtonVariant;
    leftSection?: React.ReactNode;
    onClick?: () => void;
}

export default function CopyButton({
    value,
    color = "success",
    text = "Copy",
    size = "sm",
    variant = "light",
    leftSection,
    onClick,
    ...props
}: IProps) {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = (copy: () => void) => {
        setIsCopied(true);
        copy();

        if (onClick) {
            onClick();
        }

        setTimeout(() => {
            setIsCopied(false);
        }, 1000);
    };

    return (
        <MantineCopyButton value={value} timeout={1000}>
            {({ copied, copy }) => (
                <Button
                    size={size}
                    color={color}
                    variant={variant}
                    onClick={() => handleCopy(copy)}
                    loading={isCopied ?? copied}
                    leftSection={leftSection}
                    loaderProps={{
                        children: (
                            <Group gap={4}>
                                <FontAwesomeIcon icon="check" />
                                <Text size={size} fw={700}>
                                    Copied!
                                </Text>
                            </Group>
                        ),
                    }}
                    {...props}>
                    {text}
                </Button>
            )}
        </MantineCopyButton>
    );
}
