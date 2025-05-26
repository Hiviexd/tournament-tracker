import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Badge, Tooltip, Group } from "@mantine/core";
import { IconProp } from "@fortawesome/fontawesome-svg-core";

interface IProps {
    type: string;
    withText?: boolean;
}

export default function TournamentTypeBadge({ type, withText = false }: IProps) {
    const getTournamentTypeInfo = () => {
        switch (type) {
            case "tournament":
                return { icon: "trophy", text: "Tournament", color: "orange" };
            case "contest":
                return { icon: "award", text: "Contest", color: "info" };
            default:
                return { icon: "question", text: "Unknown", color: "gray" };
        }
    };
    return (
        <Tooltip label={getTournamentTypeInfo().text}>
            <Badge color={getTournamentTypeInfo().color} variant="light">
                <Group gap={5}>
                    <FontAwesomeIcon icon={getTournamentTypeInfo().icon as IconProp} />
                    {withText && getTournamentTypeInfo().text}
                </Group>
            </Badge>
        </Tooltip>
    );
}
