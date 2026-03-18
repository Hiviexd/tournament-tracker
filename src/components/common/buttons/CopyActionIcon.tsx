import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { CopyButton, ActionIcon, Tooltip, type DefaultMantineSize, type DefaultMantineColor, type ActionIconVariant } from "@mantine/core";

interface IProps {
    value: string;
    color?: DefaultMantineColor;
    tooltip?: string;
    size?: DefaultMantineSize;
    variant?: ActionIconVariant;
    onClick?: () => void;
}

export default function CopyActionIcon({ value, color = "success", tooltip = "Copy", size = "md", variant = "subtle", onClick }: IProps) {
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
        <CopyButton value={value} timeout={1000}>
            {({ copied, copy }) => (
                <Tooltip label={copied ? "Copied!" : tooltip}>
                    <ActionIcon
                        size={size}
                        color={color}
                        variant={isCopied ? "light" : variant}
                        onClick={() => handleCopy(copy)}
                        loading={isCopied ?? copied}
                        loaderProps={{
                            children: <FontAwesomeIcon icon="check" />,
                        }}>
                        <FontAwesomeIcon icon="copy" size="sm" />
                    </ActionIcon>
                </Tooltip>
            )}
        </CopyButton>
    );
}
