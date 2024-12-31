import { Badge, Tooltip } from "@mantine/core";
import { IUser } from "../../../../interfaces/User";

interface IPropTypes {
    user: IUser;
}

export default function UserGroupBadge({ user }: IPropTypes) {
    const getUserGroupBadge = () => {
        if (user.isTournamentCommittee) {
            return {
                tooltip: "Tournament Committee",
                props: {
                    color: "warning",
                    variant: "outline",
                    style: {
                        background: "color-mix(in srgb, black 25%, transparent)",
                    },
                    children: "TC",
                },
            };
        } else if (user.isContestCommittee) {
            return {
                tooltip: "Contest Committee",
                props: {
                    color: "info",
                    variant: "outline",
                    style: {
                        background: "color-mix(in srgb, black 25%, transparent)",
                    },
                    children: "CC",
                },
            };
        } else if (user.isAlumni) {
            return {
                tooltip: "Alumni",
                props: {
                    color: "gray.6",
                    variant: "outline",
                    style: {
                        background: "color-mix(in srgb, black 25%, transparent)",
                    },
                    children: "ALM",
                },
            };
        }
        return null;
    };

    const badgeData = getUserGroupBadge();
    if (!badgeData) return null;

    return (
        <Tooltip label={badgeData.tooltip} position="right">
            <Badge {...badgeData.props} />
        </Tooltip>
    );
}
