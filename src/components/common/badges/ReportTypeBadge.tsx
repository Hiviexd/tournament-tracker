import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Badge, Tooltip } from "@mantine/core";
import { ITicket } from "../../../../interfaces/Ticket";
import { IconProp } from "@fortawesome/fontawesome-svg-core";

interface IProps {
    report: ITicket;
}

export default function ReportTypeBadge({ report }: IProps) {
    if (report.isTicket) return null;

    const getTargetInfo = () => {
        if (report.targetUser) {
            return {
                text: "User Report",
                icon: "user",
                color: "red",
            };
        }
        if (report.targetTournamentName) {
            return {
                text: "Tournament Report",
                icon: "trophy",
                color: "orange",
            };
        }
        return {
            text: "Unknown Type",
            icon: "question",
            color: "gray",
        };
    };
    return (
        <Tooltip label={getTargetInfo().text}>
            <Badge color={getTargetInfo().color} variant="light">
                <FontAwesomeIcon icon={getTargetInfo().icon as IconProp} />
            </Badge>
        </Tooltip>
    );
}
