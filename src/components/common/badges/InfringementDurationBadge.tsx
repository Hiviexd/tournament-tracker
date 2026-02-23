import { Badge, Tooltip, type MantineSize } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IInfringement } from "../../../../interfaces/Infringement";
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
    if (!infringement.startDate && !infringement.endDate) {
        return (
            <Badge variant={variant} color="gray.6" size={size} leftSection={<FontAwesomeIcon icon="times-circle" />}>
                N/A
            </Badge>
        );
    }

    // Handle indefinite duration
    if (infringement.isIndefinite) {
        return (
            <Badge variant={variant} color="danger" size={size} leftSection={<FontAwesomeIcon icon="times-circle" />}>
                Indefinite
            </Badge>
        );
    }

    const duration = moment(infringement.endDate).diff(moment(infringement.startDate), "days");

    // Get color based on duration
    const getColor = () => {
        if (duration <= 30) return "yellow";
        if (duration <= 180) return "orange";
        return "red";
    };

    const durationText = moment.duration(duration, "days").humanize();

    return (
        <Tooltip label={`${moment(infringement.startDate).format("MMM D, YYYY")} — ${moment(infringement.endDate).format("MMM D, YYYY")}`}>
            <Badge variant={variant} color={getColor()} size={size} leftSection={<FontAwesomeIcon icon="clock" />}>
                {durationText}
            </Badge>
        </Tooltip>
    );
}
