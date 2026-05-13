import { Badge, Tooltip, type MantineSize } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IInfringement } from "../../../../interfaces/Infringement";
import dayjs from "../../../../utils/dayjs";

interface IProps {
    infringement: IInfringement | null;
    variant?: "light" | "filled";
    size?: MantineSize;
    hideEndsText?: boolean;
}

export default function InfringementExpirationBadge({ infringement, variant = "light", size = "md", hideEndsText = false }: IProps) {
    if (!infringement) {
        return null;
    }

    if (!infringement.endDate || infringement.isIndefinite) {
        return (
            <Badge variant={variant} color="danger" size={size} leftSection={<FontAwesomeIcon icon="times-circle" />}>
                Indefinite
            </Badge>
        );
    }

    const now = dayjs();
    const daysUntilExpiration = dayjs(infringement.endDate).diff(now, "days");

    // Get color based on days until expiration
    const getColor = () => {
        if (infringement.isExpired) return "gray"; // Expired
        if (daysUntilExpiration <= 7) return "success"; // Less than a week
        if (daysUntilExpiration <= 30) return "warning"; // Less than a month
        return "red"; // More than a month
    };

    return (
        <Tooltip label={dayjs(infringement.endDate).format("LLL")}>
            <Badge variant={variant} color={getColor()} size={size} leftSection={<FontAwesomeIcon icon="calendar" />}>
            {hideEndsText ? "" : infringement.isExpired ? "Ended" : "Ends"} {dayjs(infringement.endDate).fromNow()}
            </Badge>
        </Tooltip>
    );
}
