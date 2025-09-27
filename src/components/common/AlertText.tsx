import { Text, type MantineSize } from "@mantine/core";
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

    return (
        <Text fw={500} size={size} c={type}>
            <FontAwesomeIcon icon={icon ?? (IconTypeMap[type] as IconProp)} /> {children}
        </Text>
    );
}
