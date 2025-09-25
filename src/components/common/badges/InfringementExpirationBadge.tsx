import { Badge, Tooltip, type MantineSize } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IInfringement } from "../../../../interfaces/User";
import moment from "moment";

interface IProps {
    infringement: IInfringement | null;
    variant?: "light" | "filled";
    size?: MantineSize;
}

export default function InfringementExpirationBadge({ infringement, variant = "light", size = "md" }: IProps) {
    if (!infringement) {
        return null;
    }

    if (infringement.duration <= 0) {
        return (
            <Badge variant={variant} color="gray.6" size={size} leftSection={<FontAwesomeIcon icon="times-circle" />}>
                N/A
            </Badge>
        );
    }

    const expirationDate = moment(infringement.expiresAt);
    const now = moment();
    const daysUntilExpiration = expirationDate.diff(now, "days");

    // Get color based on days until expiration
    const getColor = () => {
        if (daysUntilExpiration < 0) return "gray"; // Expired
        if (daysUntilExpiration <= 7) return "success"; // Less than a week
        if (daysUntilExpiration <= 30) return "warning"; // Less than a month
        return "red"; // More than a month
    };

    const getText = () => {
        if (daysUntilExpiration < 0) return "Expired";
        return expirationDate.fromNow();
    };

    return (
        <Tooltip label={expirationDate.format("LLL")}>
            <Badge variant={variant} color={getColor()} size={size} leftSection={<FontAwesomeIcon icon="calendar" />}>
                {getText()}
            </Badge>
        </Tooltip>
    );
}
