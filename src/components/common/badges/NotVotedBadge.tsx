// Base
import { IVoting } from "../../../../interfaces/Voting";
import { IUser } from "../../../../interfaces/User";

// Mantine
import { Badge } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface IProps {
    voting: IVoting;
    user: IUser | null;
    variant?: string;
}

export default function NotVotedBadge({ voting, user, variant = "light" }: IProps) {
    const checkUserVoted = (): boolean => {
        if (!voting.votes || !user) return false;

        // First check if user is in any of the assigned groups
        const isInAssignedGroups = voting.assignedGroups.some((group) => {
            switch (group) {
                case "tc":
                    return user.isTournamentCommittee;
                case "cc":
                    return user.isContestCommittee;
                default:
                    return false;
            }
        });

        if (!isInAssignedGroups) return true; // Return true to prevent badge from showing
        return voting.votes.some((vote) => vote.author && vote.author._id === user._id);
    };

    if (checkUserVoted()) return null;

    return (
        <Badge color="orange" variant={variant}>
            <FontAwesomeIcon icon="exclamation-triangle" /> Not voted
        </Badge>
    );
}
