import { Badge, Tooltip, type BadgeVariant } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import moment from "moment";
import utils from "../../../../utils";

interface IDateBadgeProps {
    date: Date;
    staticColor?: boolean;
    warningAge?: number; // Days before warning color
    dangerAge?: number; // Days before danger color
    variant?: BadgeVariant;
}

export default function DateBadge({
    date,
    warningAge = 7,
    dangerAge = 14,
    variant = "light",
    staticColor = false,
}: IDateBadgeProps) {
    const getColor = () => {
        if (staticColor) return "gray";
        const daysOld = moment().diff(moment(date), "days");

        if (daysOld >= dangerAge) return "danger";
        if (daysOld >= warningAge) return "warning";
        return "success";
    };

    return (
        <Badge variant={variant} color={getColor()}>
            <FontAwesomeIcon icon="clock" />{" "}
            <Tooltip label={moment(date).format("LLL")}>
                <span>{utils.getShortRelativeTime(date)}</span>
            </Tooltip>
        </Badge>
    );
}
