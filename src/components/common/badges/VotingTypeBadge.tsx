import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Badge, Tooltip } from "@mantine/core";

interface IPropTypes {
    type: string;
}

export default function VotingTypeBadge({ type }: IPropTypes) {
    const getVotingTypeInfo = (): { icon: IconProp; text: string; color: string } => {
        switch (type) {
            case "tournament":
                return { icon: "trophy", text: "Tournament Vote", color: "orange" };
            case "user":
                return { icon: "user", text: "User Vote", color: "red" };
            case "discussion":
                return { icon: "comments", text: "Discussion Vote", color: "teal" };
            default:
                return { icon: "question", text: "Unknown", color: "gray" };
        }
    };

    return (
        <Tooltip label={getVotingTypeInfo().text}>
            <Badge color={getVotingTypeInfo().color} variant="light">
                <FontAwesomeIcon icon={getVotingTypeInfo().icon} />
            </Badge>
        </Tooltip>
    );
}
