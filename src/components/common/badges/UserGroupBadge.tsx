import { Badge, Tooltip } from "@mantine/core";
import { IUser, type UserGroup } from "../../../../interfaces/User";

interface IPropTypes {
    user?: IUser;
    group?: UserGroup;
    tooltip?: "top" | "right" | "bottom" | "left";
}

interface IBadgeConfig {
    tooltip: string;
    label: string;
    color: string;
}

const USER_GROUP_BADGES: Record<string, IBadgeConfig> = {
    tc: {
        tooltip: "Tournament Committee",
        label: "TC",
        color: "#FFB969",
    },
    cc: {
        tooltip: "Contest Committee",
        label: "CC",
        color: "var(--mantine-color-info-6)",
    },
    alm: {
        tooltip: "Alumni",
        label: "ALM",
        color: "var(--mantine-color-gray-6)",
    },
};

export default function UserGroupBadge({ user, group, tooltip }: IPropTypes) {
    const getBadgeType = () => {
        if (group) return group;
        if (user?.isTournamentCommittee) return "tc";
        if (user?.isContestCommittee) return "cc";
        if (user?.isAlumni) return "alm";
        return null;
    };

    const badgeType = getBadgeType();
    if (!badgeType) return null;

    const usegroup = USER_GROUP_BADGES[badgeType];

    return (
        <Tooltip label={usegroup.tooltip} position={tooltip ?? "right"}>
            <Badge
                color={usegroup.color}
                variant="light"
                style={{
                    background: "color-mix(in srgb, var(--mantine-color-primary-11) 75%, transparent)",
                    border: `1px solid ${usegroup.color}`,
                }}>
                {usegroup.label}
            </Badge>
        </Tooltip>
    );
}
