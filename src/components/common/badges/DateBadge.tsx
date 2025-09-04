import { Badge, Tooltip, type BadgeVariant, type MantineSize } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import moment from "moment";
import utils from "../../../../utils";

interface IDateBadgeProps {
    date: Date;
    staticColor?: boolean;
    warningAge?: number; // Days before warning color
    dangerAge?: number; // Days before danger color
    variant?: BadgeVariant;
    size?: MantineSize;
}

export default function DateBadge({
    date,
    warningAge = 7,
    dangerAge = 14,
    variant = "light",
    staticColor = false,
    size = "md",
}: IDateBadgeProps) {
    const getColor = () => {
        if (staticColor) return "gray";
        const daysOld = moment().diff(moment(date), "days");

        if (daysOld >= dangerAge) return "danger";
        if (daysOld >= warningAge) return "warning";
        return "success";
    };

    return (
        <Tooltip label={moment(date).format("LLL")}>
            <Badge variant={variant} color={getColor()} size={size}>
                <FontAwesomeIcon icon="clock" /> {utils.getShortRelativeTime(date)}
            </Badge>
        </Tooltip>
    );
}
