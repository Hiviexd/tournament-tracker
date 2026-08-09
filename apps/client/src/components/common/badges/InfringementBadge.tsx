import { Badge, type MantineSize } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IInfringement, InfringementType } from "@tc/types/Infringement";
import { IconProp } from "@fortawesome/fontawesome-svg-core";

interface IProps {
    infringement: IInfringement | null;
    variant?: "light" | "filled";
    size?: MantineSize;
}

interface IBadgeConfig {
    color: string;
    icon: string;
}

const infringementConfig: Record<InfringementType, IBadgeConfig> = {
    [InfringementType.NOTE]: {
        color: "blue",
        icon: "sticky-note",
    },
    [InfringementType.WARNING]: {
        color: "yellow",
        icon: "exclamation-triangle",
    },
    [InfringementType.TOURNAMENT_BAN]: {
        color: "red",
        icon: "trophy",
    },
    [InfringementType.HOSTING_BAN]: {
        color: "red",
        icon: "user-shield",
    },
    [InfringementType.STAFFING_BAN]: {
        color: "red",
        icon: "user-gear",
    },
};

export default function InfringementBadge({ infringement, variant = "light", size = "md" }: IProps) {
    if (!infringement) {
        return null;
    }

    const config = infringementConfig[infringement.type];

    return (
        <Badge
            variant={variant}
            color={config.color}
            size={size}
            leftSection={<FontAwesomeIcon icon={config.icon as IconProp} />}>
            {infringement.typeString}
        </Badge>
    );
}
