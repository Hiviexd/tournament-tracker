import { Badge, Tooltip, type MantineSize } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IInfringement } from "../../../../interfaces/User";
import moment from "moment";

interface IProps {
    infringement: IInfringement | null;
    variant?: "light" | "filled";
    size?: MantineSize;
}

export default function InfringementDurationBadge({ infringement, variant = "light", size = "md" }: IProps) {
    if (!infringement) {
        return null;
    }

    // Don't render if duration is 0
    if (infringement.duration === 0) {
        return (
            <Badge variant={variant} color="gray.6" size={size} leftSection={<FontAwesomeIcon icon="times-circle" />}>
                N/A
            </Badge>
        );
    }

    // Handle indefinite duration
    if (infringement.duration === -1) {
        return (
            <Badge variant={variant} color="danger" size={size} leftSection={<FontAwesomeIcon icon="times-circle" />}>
                Indefinite
            </Badge>
        );
    }

    // Get color based on duration
    const getColor = () => {
        if (infringement.duration <= 30) return "yellow";
        if (infringement.duration <= 180) return "orange";
        return "red";
    };

    const durationText = moment.duration(infringement.duration, "days").humanize();

    return (
        <Tooltip label={`${infringement.duration} days`}>
            <Badge variant={variant} color={getColor()} size={size} leftSection={<FontAwesomeIcon icon="clock" />}>
                {durationText}
            </Badge>
        </Tooltip>
    );
}
