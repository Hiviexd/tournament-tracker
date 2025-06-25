import { Badge } from "@mantine/core";
import { ITournament } from "../../../../interfaces/Tournament";
import utils from "../../../../utils";

interface IProps {
    tournament: ITournament;
    variant?: "light" | "filled";
    size?: "sm" | "md" | "lg" | "xl";
}

export default function TournamentStatusBadge({ tournament, variant = "light", size }: IProps) {
    const statusString = tournament.status === "reviewOngoing" ? "Under Review" : tournament.statusString;
    return (
        <Badge color={utils.getTournamentStatusColor(tournament.status)} variant={variant} size={size}>
            {statusString || tournament.status}
        </Badge>
    );
}
