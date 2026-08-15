import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Badge, Tooltip, Group, type MantineSize } from "@mantine/core";
import { IconProp } from "@fortawesome/fontawesome-svg-core";

interface IProps {
    type: string;
    withText?: boolean;
    size?: MantineSize;
}

type TournamentTypeInfo = { icon: IconProp; text: string; color: string };

export default function TournamentTypeBadge({ type, withText = false, size }: IProps) {
    const getTournamentTypeInfo = (): TournamentTypeInfo => {
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
            <Badge color={getTournamentTypeInfo().color} variant="light" size={size}>
                <Group gap={5}>
                    <FontAwesomeIcon icon={getTournamentTypeInfo().icon} />
                    {withText && getTournamentTypeInfo().text}
                </Group>
            </Badge>
        </Tooltip>
    );
}
