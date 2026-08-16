import { Badge } from "@mantine/core";
import { VOTE_BADGE_COLORS } from "../../../../constants";

interface IProps {
    option: number;
    options: string[];
}

export default function ClassicVoteDisplay({ option, options }: IProps) {
    return (
        <Badge size="lg" variant="light" color={VOTE_BADGE_COLORS[option % VOTE_BADGE_COLORS.length]}>
            {options[option]}
        </Badge>
    );
}
