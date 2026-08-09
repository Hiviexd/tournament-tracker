// src/components/users/details/BadgeManager.tsx
import { Group, Stack, Text, ActionIcon, Image, Card } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IUser } from "@tc/types/User";
import { useUpdateUserBadge } from "../../../hooks/useUsers";
import { useAtom } from "jotai";
import { loggedInUserAtom } from "../../../store/atoms";
import utils from "@tc/utils/client";
import CopyButton from "../../common/buttons/CopyButton";

function CommitteeBadgePlaceholderCard() {
    return (
        <Card w={86} h={40} bg="var(--mantine-color-primary-10)" p="xs" radius="sm">
            <Group h="100%" justify="center" align="center">
                <Text size="xs">None...</Text>
            </Group>
        </Card>
    );
}

interface IProps {
    user: IUser;
    committee: "tc" | "cc";
}

export default function BadgeManager({ user, committee }: IProps) {
    const [loggedInUser] = useAtom(loggedInUserAtom);
    const updateBadgeMutation = useUpdateUserBadge(user.id || "");

    const isValidBadge = user.badgeValue > 0 && user.badgeValue <= 10;
    const eligibleBadgeYears = utils.getYearsFromDays(committee === "tc" ? user.tcDuration : user.ccDuration);

    const handleBadgeUpdate = async (increment: boolean) => {
        try {
            await updateBadgeMutation.mutateAsync({
                userId: user.id,
                increment,
            });
        } catch (error) {
            console.error("Failed to update badge value:", error);
        }
    };

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
                            disabled={user.badgeValue === 0}
                            loading={updateBadgeMutation.isPending}>
                            <FontAwesomeIcon icon="chevron-left" />
                        </ActionIcon>
                    )}

                    {isValidBadge ? (
                        <Image
                            src={`https://assets.ppy.sh/profile-badges/tcomm-${user.badgeValue}y@2x.png`}
                            alt={`Committee Badge Level ${user.badgeValue}`}
                            w={86}
                            radius="sm"
                        />
                    ) : (
                        <CommitteeBadgePlaceholderCard />
                    )}

                    {loggedInUser!.isAdmin && (
                        <ActionIcon
                            variant="subtle"
                            color="gray"
                            onClick={() => handleBadgeUpdate(true)}
                            disabled={user.badgeValue === 10}
                            loading={updateBadgeMutation.isPending}>
                            <FontAwesomeIcon icon="chevron-right" />
                        </ActionIcon>
                    )}
                    {loggedInUser!.isAdmin && user.badgeValue !== eligibleBadgeYears && (
                        <CopyButton
                            value={utils.generateBadgeCommand(
                                user.osuId,
                                eligibleBadgeYears,
                                user.badgeValue,
                                committee,
                            )}
                            text="Copy Badge Command"
                            leftSection={<FontAwesomeIcon icon="copy" />}
                            size="xs"
                            color="primary"
                        />
                    )}
                </Group>
            </Stack>
        </Stack>
    );
}
