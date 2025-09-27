import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Tooltip, Badge } from "@mantine/core";
import { IInfringement } from "../../../../interfaces/User";

export default function BanIconBadge({ infringement }: { infringement: IInfringement }) {
    return (
        <Tooltip label={`${infringement.isIndefinite ? "Indefinite" : "Active"} ${infringement.typeString}`} zIndex={1000}>
            <Badge variant="light" color="danger" size="xs" ml={4}>
                <FontAwesomeIcon icon="gavel" />
            </Badge>
        </Tooltip>
    );
}
