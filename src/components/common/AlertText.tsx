import { Flex, Text, type MantineSize } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";

interface IProps {
    children: React.ReactNode;
    type: "success" | "warning" | "danger" | "info";
    icon?: IconProp;
    size?: MantineSize;
}

export default function AlertText({ children, type, size = "sm", icon }: IProps) {
    const IconTypeMap = {
        success: "circle-check",
        warning: "exclamation-triangle",
        danger: "circle-xmark",
        info: "circle-info",
    };

    if (typeof children === "string") {
        return (
            <Text fw={500} size={size} c={type}>
                <FontAwesomeIcon icon={icon ?? (IconTypeMap[type] as IconProp)} /> {children}
            </Text>
        );
    }

    return (
        <Flex align="flex-start" gap="xs" c={type}>
            <Text fw={500} size={size}>
                <FontAwesomeIcon icon={icon ?? (IconTypeMap[type] as IconProp)} />
            </Text>
            {children}
        </Flex>
    );
}
