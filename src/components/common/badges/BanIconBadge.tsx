import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Tooltip, Badge, type BadgeProps } from "@mantine/core";
import { IInfringement } from "../../../../interfaces/Infringement";

interface IPropTypes extends BadgeProps {
    infringement: IInfringement;
}

export default function BanIconBadge({ infringement, ...props }: IPropTypes) {
    return (
        <Tooltip
            label={`${infringement.isIndefinite ? "Indefinite" : "Active"} ${infringement.typeString}`}
            zIndex={1000}>
            <Badge variant="light" color="danger" size="sm" ml={4} {...props}>
                <FontAwesomeIcon icon="gavel" />
            </Badge>
        </Tooltip>
    );
}
