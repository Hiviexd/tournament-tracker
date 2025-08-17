import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IUser } from "@interfaces/User";
import { IVoting } from "@interfaces/Voting";
import { Alert } from "@mantine/core";

interface IProps {
    voting: IVoting;
    user: IUser | null;
    isAbstained?: boolean;
}

export default function VoteStatusBanner({ voting, user, isAbstained = false }: IProps) {
    const userHasVoted = voting.votes.some((vote) => vote.author && vote.author._id === user?._id);

    const isInAssignedGroups = voting.assignedGroups.some((group) => {
        if (!user) return false;
        switch (group) {
            case "tc":
                return user.isTournamentCommittee;
            case "cc":
                return user.isContestCommittee;
            default:
                return false;
        }
    });

    const userNeedsToVote = !userHasVoted && isInAssignedGroups && voting.isActive;

    if (isAbstained)
        return (
            <Alert color="gray" title="You have abstained from this vote." icon={<FontAwesomeIcon icon="flag-checkered" />} />
        );

    if (userHasVoted)
        return (
            <Alert color="success" title="You have submitted a vote! 🥳" icon={<FontAwesomeIcon icon="check-to-slot" />} />
        );

    if (userNeedsToVote)
        return (
            <Alert color="warning" title="You need to submit a vote!" icon={<FontAwesomeIcon icon="check-to-slot" />} />
        );

    return null;
}
