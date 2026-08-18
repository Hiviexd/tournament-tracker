import { Group, Tooltip } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { TOURNAMENT_TYPES, TournamentType } from "@tc/types/Tournament";

export const NEWS_CATEGORY_OPTIONS = [
    { value: "tournament", label: "Tournament" },
    { value: "contest", label: "Contest" },
];

const CATEGORY_ICONS: Record<TournamentType, { icon: "trophy" | "award"; label: string }> = {
    tournament: { icon: "trophy", label: "Tournament" },
    contest: { icon: "award", label: "Contest" },
};

interface IProps {
    categories?: TournamentType[];
}

export default function NewsCategoryIcons({ categories }: IProps) {
    const visible = TOURNAMENT_TYPES.filter((category) => categories?.includes(category));
    if (visible.length === 0) return null;

    return (
        <Group
            component="span"
            gap={6}
            wrap="nowrap"
            display="inline-flex"
            align="center"
            c="primary"
            style={{ height: "1lh", verticalAlign: "top", marginRight: "0.4em" }}>
            {visible.map((category) => {
                const info = CATEGORY_ICONS[category];
                return (
                    <Tooltip key={category} label={info.label}>
                        <span style={{ display: "inline-flex", alignItems: "center" }}>
                            <FontAwesomeIcon icon={info.icon} />
                        </span>
                    </Tooltip>
                );
            })}
        </Group>
    );
}
