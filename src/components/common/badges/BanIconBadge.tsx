import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Tooltip, Badge, type BadgeProps } from "@mantine/core";
import { IInfringement } from "../../../../interfaces/Infringement";

interface IPropTypes extends BadgeProps {
    infringement: IInfringement;
    osuId: number;
}

export default function BanIconBadge({ infringement, osuId, ...props }: IPropTypes) {
    return (
        <Tooltip
            label={`${infringement.isIndefinite ? "Indefinite" : "Active"} ${infringement.typeString}`}
            zIndex={1000}>
            <Badge
                component="a"
                href={`/watchlist?user=${osuId}`}
                target="_blank"
                rel="noopener noreferrer"
                variant="light"
                color="danger"
                size="sm"
                ml={4}
                onClick={(e) => e.stopPropagation()}
                {...props}
                style={{ cursor: "pointer", ...props.style }}>
                <FontAwesomeIcon icon="gavel" />
            </Badge>
        </Tooltip>
    );
}
