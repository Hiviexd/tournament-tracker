import { Badge, Tooltip } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import moment from "moment";

interface IDateBadgeProps {
    date: Date;
    warningAge?: number; // Days before warning color
    dangerAge?: number; // Days before danger color
    variant?: "light" | "filled";
}

export default function DateBadge({ date, warningAge = 7, dangerAge = 14, variant = "light" }: IDateBadgeProps) {
    const getColor = () => {
        const daysOld = moment().diff(moment(date), "days");

        if (daysOld >= dangerAge) return "danger";
        if (daysOld >= warningAge) return "warning";
        return "success";
    };

    return (
        <Badge variant={variant} color={getColor()}>
            <FontAwesomeIcon icon="clock" />{" "}
            <Tooltip label={moment(date).format("LLL")}>
                <span>{moment(date).fromNow()}</span>
            </Tooltip>
        </Badge>
    );
}
