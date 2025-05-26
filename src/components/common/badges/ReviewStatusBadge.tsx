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
    const isAssigned = (): boolean => {
        if (!user || !tournament.assignedReviewers) return false;
        return tournament.assignedReviewers.some((reviewer) => reviewer._id === user._id);
    };

    const needsReview = (): boolean => {
        if (!user) return false;

        if (!isAssigned()) return false;

        // Check if tournament is in review state
        if (tournament.status !== "reviewOngoing" && tournament.status !== "changesRequested") return false;

        // Check if user has already submitted a review
        const hasSubmittedReview = tournament.reviews?.some((review) => review.author?._id === user._id);
        return !hasSubmittedReview;
    };

    if (!isAssigned()) return null;

    return (
        <Badge
            color={needsReview() ? "orange" : "info"}
            variant={variant}
            className={needsReview() ? "animation-pulse" : ""}>
            <FontAwesomeIcon icon={needsReview() ? "exclamation-triangle" : "check-to-slot"} />{" "}
            {needsReview() ? "Needs your review" : "Review submitted"}
        </Badge>
    );
}
