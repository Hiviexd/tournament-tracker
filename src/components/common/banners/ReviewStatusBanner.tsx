import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IUser } from "../../../../interfaces/User";
import { ITournament } from "../../../../interfaces/Tournament";
import { Alert } from "@mantine/core";

interface IProps {
    tournament: ITournament;
    user: IUser | null;
}

export default function ReviewStatusBanner({ tournament, user }: IProps) {
    const userHasReviewed = tournament.reviews.some((review) => review.author && review.author._id === user?._id);

    if (userHasReviewed)
        return (
            <Alert
                color="success"
                title="You have submitted a review! 🥳"
                icon={<FontAwesomeIcon icon="check-to-slot" />}
            />
        );
    else
        return (
            <Alert color="warning" title="You need to submit a review!" icon={<FontAwesomeIcon icon="check-to-slot" />} />
        );
}
