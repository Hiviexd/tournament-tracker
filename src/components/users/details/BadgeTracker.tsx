import { Group, Stack, Text, Title } from "@mantine/core";
import { IUser } from "../../../../interfaces/User";
import UserGroupBadge from "../../common/badges/UserGroupBadge";
import BadgeManager from "./BadgeManager";
import utils from "../../../../utils";

interface IProps {
    user: IUser;
}

export default function BadgeTracker({ user }: IProps) {
    const formatDuration = (days: number) => {
        const years = utils.getYearsFromDays(days);
        const yearsDisplay = years > 0 ? (years > 1 ? `${years} years,` : "1 year,") : "";

        const remainingDays = Math.round(days % 365);
        const daysDisplay = remainingDays > 0 ? (remainingDays > 1 ? `${remainingDays} days` : "1 day") : "0 days";

        return `${yearsDisplay} ${daysDisplay}`;
    };

    return (
        <Stack gap="xs">
            <Title order={4}>Duration</Title>

            {/* Duration Display */}
            {user.isCommittee || user.tcDuration > 0 || user.ccDuration > 0 ? (
                <Stack gap={8}>
                    <Text size="sm" c="dimmed">
                        Member for:
                    </Text>
                    {(user.isTournamentCommittee || user.tcDuration > 0) && (
                        <Group gap="xs">
                            <UserGroupBadge group="tc" />
                            <Text size="sm">{formatDuration(user.tcDuration)}</Text>
                        </Group>
                    )}
                    {(user.isContestCommittee || user.ccDuration > 0) && (
                        <Group gap="xs">
                            <UserGroupBadge group="cc" />
                            <Text size="sm">{formatDuration(user.ccDuration)}</Text>
                        </Group>
                    )}
                </Stack>
            ) : (
                <Text size="sm" c="dimmed" fs="italic">
                    No information available...
                </Text>
            )}

            {/* Badge Management */}
            {user.isCommittee && (
                <>
                    {user.isTournamentCommittee ? (
                        <BadgeManager user={user} committee="tc" />
                    ) : user.isContestCommittee ? (
                        <BadgeManager user={user} committee="cc" />
                    ) : null}
                </>
            )}
        </Stack>
    );
}
