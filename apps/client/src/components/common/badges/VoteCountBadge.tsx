import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Badge, BadgeVariant } from "@mantine/core";

interface IPropTypes {
    voteCount: number;
    totalVotes: number;
    textOverride?: string;
    variant?: BadgeVariant;
}

export default function VoteCountBadge({
    voteCount,
    totalVotes,
    textOverride = "votes",
    variant = "filled",
}: IPropTypes) {
    return (
        <Badge color={voteCount >= totalVotes ? "success" : "danger"} variant={variant}>
            <FontAwesomeIcon icon={voteCount >= totalVotes ? "check" : "times"} /> {voteCount} / {totalVotes}{" "}
            {textOverride}
        </Badge>
    );
}
