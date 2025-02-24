import { Group, Stack, Text, ActionIcon, Image, Card, Button, Title } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IUser } from "../../../../interfaces/User";
import { useUpdateUserBadge } from "../../../hooks/useUsers";
import UserGroupBadge from "./../../common/badges/UserGroupBadge";
import helpers from "../../../helpers";
import { notifications } from "@mantine/notifications";
import { useAtom } from "jotai";
import { loggedInUserAtom } from "../../../store/atoms";

interface IProps {
    user: IUser;
}

export default function BadgeTracker({ user }: IProps) {
    const [loggedInUser] = useAtom(loggedInUserAtom);
    const updateBadgeMutation = useUpdateUserBadge(user._id || "");

    const isValidBadge = user.badgeValue > 0 && user.badgeValue <= 10;
    const eligibleBadgeYears = helpers.getYearsFromDays(Math.max(user.tcDuration, user.ccDuration));

    const handleBadgeUpdate = async (increment: boolean) => {
        try {
            await updateBadgeMutation.mutateAsync({
                userId: user._id,
                increment,
            });
        } catch (error) {
            console.error("Failed to update badge value:", error);
        }
    };

    const handleCopyCommand = () => {
        const commandString = helpers.generateBadgeCommand(user.osuId, eligibleBadgeYears, user.badgeValue);

        navigator.clipboard.writeText(commandString);
        notifications.show({
            title: "Command Copied",
            message: "Badge command copied to clipboard",
            color: "success",
        });
    };

    const formatDuration = (days: number) => {
        const years = helpers.getYearsFromDays(days);
        const yearsDisplay = years > 0 ? (years > 1 ? `${years} years,` : "1 year,") : "";

        const remainingDays = days - years * 365;
        const daysDisplay = remainingDays > 0 ? (remainingDays > 1 ? `${remainingDays} days` : "1 day") : "0 days";

        return `${yearsDisplay} ${daysDisplay}`;
    };

    const NoBadgeCard = () => (
        <Card w={86} h={40} bg="var(--mantine-color-dark-6)" p="xs" radius="sm">
            <Group h="100%" justify="center" align="center">
                <Text size="xs">None...</Text>
            </Group>
        </Card>
    );

    return (
        <Stack gap="xs">
            <Title order={4}>Badge & Duration</Title>
            {/* Duration Display */}
            {(user.isCommittee || user.tcDuration > 0 || user.ccDuration > 0) ? (
                <Stack gap={8}>
                    <Text size="sm" c="dimmed">
                        Member for:
                    </Text>
                    <FontAwesomeIcon icon="ban" size="sm" />
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
                <Stack gap={6}>
                    <Group gap={4}>
                        <Text size="sm" c="dimmed">
                            Committee Badge:
                        </Text>

                        {user.badgeValue !== eligibleBadgeYears && (
                            <Text size="sm" c="danger">
                                (needs updating!)
                            </Text>
                        )}
                    </Group>
                    <Stack gap="xs">
                        <Group>
                            {loggedInUser!.isAdmin && (
                                <ActionIcon
                                    variant="subtle"
                                    color="gray"
                                    onClick={() => handleBadgeUpdate(false)}
                                    disabled={user.badgeValue === 0 || updateBadgeMutation.isPending}>
                                    <FontAwesomeIcon icon="chevron-left" />
                                </ActionIcon>
                            )}

                            {isValidBadge ? (
                                <Image
                                    src={`https://assets.ppy.sh/profile-badges/tcomm-${user.badgeValue}y.png`}
                                    alt={`Committee Badge Level ${user.badgeValue}`}
                                    width={86}
                                    height={40}
                                />
                            ) : (
                                <NoBadgeCard />
                            )}

                            {loggedInUser!.isAdmin && (
                                <ActionIcon
                                    variant="subtle"
                                    color="gray"
                                    onClick={() => handleBadgeUpdate(true)}
                                    disabled={user.badgeValue === 10 || updateBadgeMutation.isPending}>
                                    <FontAwesomeIcon icon="chevron-right" />
                                </ActionIcon>
                            )}
                            {loggedInUser!.isAdmin && user.badgeValue !== eligibleBadgeYears && (
                                <Button
                                    variant="light"
                                    color="primary"
                                    size="xs"
                                    leftSection={<FontAwesomeIcon icon="copy" />}
                                    onClick={handleCopyCommand}>
                                    Copy Badge Command
                                </Button>
                            )}
                        </Group>
                    </Stack>
                </Stack>
            )}
        </Stack>
    );
}
