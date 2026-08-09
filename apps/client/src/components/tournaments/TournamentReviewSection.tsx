import { Title, Stack, Group, Button, Divider, Card, ActionIcon, useMantineTheme, Tooltip } from "@mantine/core";
import { ITournament } from "@tc/types/Tournament";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import TournamentReviewInput from "./TournamentReviewInput";
import TournamentReviewCard from "./TournamentReviewCard";
import AssignedReviewersList from "./AssignedReviewersList";
import { useAssignReviewers } from "../../hooks/useTournaments";
import { useCommitteeUsers } from "../../hooks/useUsers";
import { loggedInUserAtom } from "../../store/atoms";
import { useAtom } from "jotai";
import { useState } from "react";
import { useMediaQuery } from "@mantine/hooks";

interface IProps {
    tournament: ITournament;
}

export default function TournamentReviewSection({ tournament }: IProps) {
    const [user] = useAtom(loggedInUserAtom);
    const [isEditingReviewers, setIsEditingReviewers] = useState(false);
    const theme = useMantineTheme();
    const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.xs})`);
    const assignReviewersMutation = useAssignReviewers(tournament.id);
    const { data: committeeUsers } = useCommitteeUsers();

    const isUserAssignedReviewer =
        user?.isCommittee && tournament.assignedReviewers?.some((reviewer) => reviewer.id === user.id);
    const isUserHost = user && tournament.hosts.some((host) => host.id === user.id);
    const isCommitteeOrAdmin = !!user && user.isCommitteeOrAdmin;

    const handleAssignReviewers = async () => {
        await assignReviewersMutation.mutateAsync();
    };

    if (!(
        (isCommitteeOrAdmin && tournament.status === "reviewOngoing") ||
        (tournament.reviews?.length > 0 && isCommitteeOrAdmin) ||
        (tournament.status === "changesRequested" && (isCommitteeOrAdmin || isUserHost))
    )) {
        return null;
    }

    return (
        <Card shadow="sm" p="lg" radius="md">
            <Stack gap="lg">
                <Title order={3}>Review Information</Title>

                <Stack gap="md">
                    {tournament.assignedReviewers?.length ? (
                        <Stack gap="xs">
                            {user?.isCommittee ? (
                                <Group align="center" gap="xs">
                                    <Title order={4}>Assigned Reviewers</Title>
                                    {!isEditingReviewers ? (
                                        <Tooltip label="Edit reviewers" position="right">
                                            <ActionIcon
                                                variant="subtle"
                                                color="blue"
                                                onClick={() => setIsEditingReviewers(true)}
                                                title="Edit reviewers">
                                                <FontAwesomeIcon icon="pen-to-square" />
                                            </ActionIcon>
                                        </Tooltip>
                                    ) : (
                                        <Tooltip label="Close editor" position="right">
                                            <ActionIcon
                                                variant="subtle"
                                                color="danger"
                                                onClick={() => setIsEditingReviewers(false)}
                                                title="Close editor">
                                                <FontAwesomeIcon icon="xmark" />
                                            </ActionIcon>
                                        </Tooltip>
                                    )}
                                </Group>
                            ) : (
                                <Title order={4}>Assigned Reviewers</Title>
                            )}
                            <AssignedReviewersList
                                tournament={tournament}
                                committeeUsers={committeeUsers}
                                currentUserId={user?.id}
                                canEdit={!!user?.isCommittee}
                                isEditing={isEditingReviewers}
                                fullWidthCards={isMobile}
                            />

                            {tournament.reviews?.length > 0 && (
                                <>
                                    <Divider my="sm" />
                                    <Title order={4}>Reviews</Title>
                                    <Stack gap="md">
                                        {tournament.reviews.map((review) => (
                                            <TournamentReviewCard
                                                key={review.id}
                                                tournament={tournament}
                                                review={review}
                                            />
                                        ))}
                                    </Stack>
                                </>
                            )}

                            {isUserAssignedReviewer && tournament.isActive && (
                                <>
                                    <Divider my="sm" />
                                    <Title order={4}>Review Input</Title>
                                    <TournamentReviewInput tournament={tournament} />
                                </>
                            )}
                        </Stack>
                    ) : user?.isCommitteeOrAdmin && tournament.status === "reviewOngoing" ? (
                        <Button
                            variant="light"
                            color="info"
                            onClick={handleAssignReviewers}
                            loading={assignReviewersMutation.isPending}
                            leftSection={<FontAwesomeIcon icon="user-group" />}>
                            Assign Reviewers
                        </Button>
                    ) : null}

                    {tournament.reviews?.length > 0 && !tournament.assignedReviewers?.length && (
                        <>
                            <Title order={4}>Reviews</Title>
                            <Stack gap="md">
                                {tournament.reviews.map((review) => (
                                    <TournamentReviewCard key={review.id} tournament={tournament} review={review} />
                                ))}
                            </Stack>
                        </>
                    )}
                </Stack>
            </Stack>
        </Card>
    );
}
