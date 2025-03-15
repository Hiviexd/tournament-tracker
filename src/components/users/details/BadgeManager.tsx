// src/components/users/details/BadgeManager.tsx
import { Group, Stack, Text, ActionIcon, Image, Card, Button } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IUser } from "../../../../interfaces/User";
import { useUpdateUserBadge } from "../../../hooks/useUsers";
import { notifications } from "@mantine/notifications";
import { useAtom } from "jotai";
import { loggedInUserAtom } from "../../../store/atoms";
import helpers from "../../../helpers";

interface IProps {
    user: IUser;
    committee: "tc" | "cc";
}

export default function BadgeManager({ user, committee }: IProps) {
    const [loggedInUser] = useAtom(loggedInUserAtom);
    const updateBadgeMutation = useUpdateUserBadge(user._id || "");

    const isValidBadge = user.badgeValue > 0 && user.badgeValue <= 10;
    const eligibleBadgeYears = helpers.getYearsFromDays(committee === "tc" ? user.tcDuration : user.ccDuration);

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
        const commandString = helpers.generateBadgeCommand(user.osuId, eligibleBadgeYears, user.badgeValue, committee);

        navigator.clipboard.writeText(commandString);
        notifications.show({
            title: "Command Copied",
            message: "Badge command copied to clipboard",
            color: "success",
        });
    };

    const NoBadgeCard = () => (
        <Card w={86} h={40} bg="var(--mantine-color-primary-10)" p="xs" radius="sm">
            <Group h="100%" justify="center" align="center">
                <Text size="xs">None...</Text>
            </Group>
        </Card>
    );

    return (
        <Stack gap={6}>
            <Group gap={4}>
                <Text size="sm" c="dimmed">
                    {committee === "tc" ? "Tournament" : "Contest"} Committee Badge:
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
                            src={`https://assets.ppy.sh/profile-badges/tcomm-${user.badgeValue}y@2x.png`}
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
    );
}
