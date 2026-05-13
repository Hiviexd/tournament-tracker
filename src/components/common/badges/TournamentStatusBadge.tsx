import { Badge, type MantineSize } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { TournamentStatus } from "../../../../interfaces/Tournament";
import utils from "../../../../utils";
import startCase from "lodash/startCase";

interface IProps {
    status: TournamentStatus;
    variant?: "light" | "filled";
    size?: MantineSize;
}

export default function TournamentStatusBadge({ status, variant = "light", size }: IProps) {
    const statusString = status === "reviewOngoing" ? "Under Review" : startCase(status);
    const statusStyles = utils.getTournamentStatusStyles(status);

    return (
        <Badge
            color={statusStyles.color}
            variant={variant}
            size={size}
            leftSection={<FontAwesomeIcon icon={statusStyles.icon} />}>
            {statusString || status}
        </Badge>
    );
}
