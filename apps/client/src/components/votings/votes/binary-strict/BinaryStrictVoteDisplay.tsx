import { Badge } from "@mantine/core";

interface IProps {
    score: number;
    options: string[];
    allowNeutralVotes: boolean;
}

function getBinaryStrictDisplay(score: number, options: string[], allowNeutralVotes: boolean) {
    const agreeOption = options[0];
    const disagreeOption = allowNeutralVotes ? options[2] : options[1];
    const neutralOption = allowNeutralVotes ? options[1] : null;

    switch (score) {
        case 1:
            return { label: agreeOption, color: "success" };
        case 0:
            return { label: neutralOption, color: "gray" };
        case -1:
            return { label: disagreeOption, color: "danger" };
        default:
            return { label: "Unknown", color: "gray" };
    }
}

export default function BinaryStrictVoteDisplay({ score, options, allowNeutralVotes }: IProps) {
    const { label, color } = getBinaryStrictDisplay(score, options, allowNeutralVotes);

    return (
        <Badge size="lg" variant="light" color={color}>
            {label}
        </Badge>
    );
}
