import { Text, type MantineSize, Flex } from "@mantine/core";
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
        <Flex gap={8} c={type} align="flex-start">
            <FontAwesomeIcon
                icon={icon ?? (IconTypeMap[type] as IconProp)}
                size={size as SizeProp}
                style={{ marginTop: "3px" }}
            />
            <Text span fw={500} size={size}>
                {children}
            </Text>
        </Flex>
    );
}
