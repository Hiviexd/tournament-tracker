import dayjs from "@tc/utils/dayjs";
import { Badge, BadgeVariant, Tooltip, type MantineSize } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface IPropTypes {
    date: Date;
    variant?: BadgeVariant;
    size?: MantineSize;
}

export default function DueDateBadge({ date, variant = "filled", size }: IPropTypes) {
    const getDueDateColor = (): string => {
        const deadline = dayjs(date);
        const now = dayjs();
        if (deadline.isBefore(now)) return "danger";
        if (deadline.isBefore(now.add(24, "hours"))) return "warning";
        return "success";
    };

    return (
        <Tooltip label={dayjs(date).format("LLL")}>
            <Badge color={getDueDateColor()} variant={variant} size={size}>
                <FontAwesomeIcon icon="clock" /> Due {dayjs(date).fromNow()}
            </Badge>
        </Tooltip>
    );
}
