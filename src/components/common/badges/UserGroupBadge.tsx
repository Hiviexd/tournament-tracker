import { Badge } from "@mantine/core";
import { IUser } from "../../../../interfaces/User";

interface IPropTypes {
    user: IUser;
}

export default function UserGroupBadge({ user }: IPropTypes) {
    const getUserGroupBadge = () => {
        if (user.isTournamentCommittee) {
            return <Badge color="primary">TC</Badge>;
        } else if (user.isContestCommittee) {
            return <Badge color="primary">CC</Badge>;
        } else if (user.isAlumni) {
            return <Badge color="secondary">ALM</Badge>;
        }
    }
    return getUserGroupBadge();
}
