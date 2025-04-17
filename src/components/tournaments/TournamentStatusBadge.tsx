import { Badge } from "@mantine/core";
import { ITournament, TournamentStatus } from "../../../interfaces/Tournament";

interface IProps {
    tournament: ITournament;
    variant?: "light" | "filled";
    size?: "sm" | "md" | "lg" | "xl";
}

const getTournamentStatusColor = (status: TournamentStatus): string => {
    switch (status) {
        case "supportRequestReceived":
            return "violet";
        case "screeningConcluded":
            return "info";
        case "reviewOngoing":
            return "yellow";
        case "onHold":
            return "pink";
        case "changesRequested":
            return "orange";
        case "badgeApproved":
            return "success";
        case "badgeRejected":
            return "danger";
        case "noBadgeRequested":
            return "gray.6";
        default:
            return "gray";
    }
};

export default function TournamentStatusBadge({ tournament, variant = "light", size }: IProps) {
    const statusString = tournament.status === "reviewOngoing" ? "Under Review" : tournament.statusString;
    return (
        <Badge color={getTournamentStatusColor(tournament.status)} variant={variant} size={size}>
            {statusString || tournament.status}
        </Badge>
    );
}
