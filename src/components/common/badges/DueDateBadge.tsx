import moment from "moment";
import { Badge, BadgeVariant, Tooltip } from "@mantine/core";

interface IPropTypes {
    date: Date;
    variant?: BadgeVariant;
}

export default function DueDateBadge({ date, variant = "filled" }: IPropTypes) {
    const getDueDateColor = (): string => {
        const deadline = moment(date);
        const now = moment();
        if (deadline.isBefore(now)) return "danger";
        if (deadline.isBefore(now.add(24, "hours"))) return "warning";
        return "success";
    };

    return (
        <Tooltip label={moment(date).format("LLL")}>
            <Badge color={getDueDateColor()} variant={variant}>
                Due {moment(date).fromNow()}
            </Badge>
        </Tooltip>
    );
}
