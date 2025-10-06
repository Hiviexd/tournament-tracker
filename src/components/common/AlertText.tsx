import { Text, type MantineSize, Group } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp, SizeProp } from "@fortawesome/fontawesome-svg-core";

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
        <Group gap={8} c={type}>
            <FontAwesomeIcon icon={icon ?? (IconTypeMap[type] as IconProp)} size={size as SizeProp} />
            <Text span fw={500} size={size}>
                {children}
            </Text>
        </Group>
    );
}
