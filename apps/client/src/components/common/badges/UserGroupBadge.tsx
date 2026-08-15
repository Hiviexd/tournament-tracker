import { Badge, Tooltip, type MantineSize } from "@mantine/core";
import { type UserGroup } from "@tc/types/User";

interface IPropTypes {
    group?: UserGroup;
    tooltip?: "top" | "right" | "bottom" | "left";
    variant?: "default" | "light";
    size?: MantineSize;
}

interface IBadgeConfig {
    tooltip: string;
    label: string;
    color: string;
}

const USER_GROUP_BADGES = {
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
} as const satisfies Record<string, IBadgeConfig>;

export default function UserGroupBadge({ group, tooltip, variant = "default", size }: IPropTypes) {
    if (!group) return null;
    const usegroup = USER_GROUP_BADGES[group];

    return (
        <Tooltip label={usegroup.tooltip} position={tooltip ?? "right"}>
            <Badge
                color={usegroup.color}
                variant="light"
                size={size}
                style={
                    variant === "light"
                        ? {}
                        : {
                              background: "color-mix(in srgb, var(--mantine-color-primary-11) 75%, transparent)",
                              border: `1px solid ${usegroup.color}`,
                          }
                }>
                {usegroup.label}
            </Badge>
        </Tooltip>
    );
}
