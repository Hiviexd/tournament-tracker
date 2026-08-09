import { Badge, Tooltip, type BadgeVariant, type MantineSize } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import dayjs from "@tc/utils/dayjs";

interface IDateBadgeProps {
    date: Date;
    staticColor?: boolean;
    warningAge?: number; // Days before warning color
    dangerAge?: number; // Days before danger color
    variant?: BadgeVariant;
    size?: MantineSize;
    color?: string;
}

export default function DateBadge({
    date,
    warningAge = 7,
    dangerAge = 14,
    variant = "light",
    staticColor = false,
    size = "md",
    color,
}: IDateBadgeProps) {
    const getColor = () => {
        if (staticColor) return "gray";
        const daysOld = dayjs().diff(dayjs(date), "days");

        if (daysOld >= dangerAge) return "danger";
        if (daysOld >= warningAge) return "warning";
        return "success";
    };

    const badgeLabel = dayjs(date).shortRelativeTime();

    return (
        <Tooltip label={dayjs(date).format("LLL")}>
            <Badge variant={variant} color={color || getColor()} size={size}>
                <FontAwesomeIcon icon="clock" /> {badgeLabel}
            </Badge>
        </Tooltip>
    );
}
