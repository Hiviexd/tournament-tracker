import { Badge } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ITournament } from "../../../../interfaces/Tournament";
import { IUser } from "../../../../interfaces/User";

interface IProps {
    tournament: ITournament;
    user: IUser | null;
    variant?: string;
}

export default function ReviewStatusBadge({ tournament, user, variant = "light" }: IProps) {
    const needsReview = (): boolean => {
        if (!user || !tournament.assignedReviewers) return false;

        // Check if user is assigned to this tournament
        const isAssigned = tournament.assignedReviewers.some((reviewer) => reviewer._id === user._id);
        if (!isAssigned) return false;

        // Check if tournament is in review state
        if (tournament.status !== "reviewOngoing" && tournament.status !== "changesRequested") return false;

        // Check if user has already submitted a review
        const hasSubmittedReview = tournament.reviews?.some((review) => review.author._id === user._id);
        return !hasSubmittedReview;
    };

    if (!needsReview()) return null;

    return (
        <Badge color="orange" variant={variant}>
            <FontAwesomeIcon icon="exclamation-triangle" /> Needs your review
        </Badge>
    );
}
