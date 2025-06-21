import { Title, Stack, Group, Button, Divider, Select, ActionIcon, Card } from "@mantine/core";
import { ITournament } from "../../../interfaces/Tournament";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import UserCard from "../common/UserCard";
import TournamentReviewInput from "./TournamentReviewInput";
import TournamentReviewCard from "./TournamentReviewCard";
import { useAssignReviewers, useReassignReviewer } from "../../hooks/useTournaments";
import { useCommitteeUsers } from "../../hooks/useUsers";
import { useState } from "react";
import { loggedInUserAtom } from "../../store/atoms";
import { useAtom } from "jotai";

interface IProps {
    tournament: ITournament;
}

export default function TournamentReviewSection({ tournament }: IProps) {
    const [user] = useAtom(loggedInUserAtom);

    const [isEditingReviewer, setIsEditingReviewer] = useState<boolean>(false);
    const [reviewer1, setReviewer1] = useState<string>("");
    const [reviewer2, setReviewer2] = useState<string>("");

    const assignReviewersMutation = useAssignReviewers(tournament._id);
    const reassignReviewerMutation = useReassignReviewer(tournament._id);
    const { data: committeeUsers } = useCommitteeUsers();

    // Check if current user is a committee member and an assigned reviewer
    const isUserAssignedReviewer =
        user?.isCommittee && tournament.assignedReviewers?.some((reviewer) => reviewer._id === user._id);

    // Check if current user is the tournament host
    const isUserHost = user?._id === tournament.host._id;

    const handleAssignReviewers = async () => {
        await assignReviewersMutation.mutateAsync();
    };

    const handleReassignReviewer = async (oldReviewerId: string, newReviewerId: string, isFirst: boolean) => {
        await reassignReviewerMutation.mutateAsync({
            oldReviewerId,
            newReviewerId,
        });
        if (isFirst) {
            setReviewer1("");
        } else {
            setReviewer2("");
        }
        setIsEditingReviewer(false);
    };

    const handleCancelEdit = () => {
        setIsEditingReviewer(false);
        setReviewer1("");
        setReviewer2("");
    };

    const getCommitteeOptions = () => {
        if (!committeeUsers) return [];

        const reviewerGroup = tournament.type === "tournament" ? "tc" : "cc";

        // Get the current reviewer IDs to exclude
        const currentReviewerIds = tournament.assignedReviewers?.map((reviewer) => reviewer._id) || [];

        return committeeUsers
            .filter(
                (user) =>
                    user.groups.includes(reviewerGroup) &&
                    !currentReviewerIds.includes(user._id) &&
                    user.isActiveReviewer
            )
            .map((user) => ({
                value: user._id,
                label: user.username,
            }));
    };

    // Only show the section if:
    // 1. User is committee member and tournament is in reviewOngoing, OR
    // 2. Tournament has reviews and user is committee, OR
    // 3. Tournament status is changesRequested and user is either committee or host
    if (
        !(
            (user?.isCommittee && tournament.status === "reviewOngoing") ||
            (tournament.reviews?.length > 0 && user?.isCommittee) ||
            (tournament.status === "changesRequested" && (user?.isCommittee || isUserHost))
        )
    ) {
        return null;
    }

    return (
        <Card shadow="sm" p="lg" radius="md">
            <Stack gap="lg">
                <Title order={3}>Review Information</Title>

                <Stack gap="md">
                    {/* Assigned reviewers section */}
                    {tournament.assignedReviewers?.length ? (
                        <Stack gap="xs">
                            {user?.isCommittee && (
                                <Group align="center" gap="xs">
                                    <Title order={4}>Assigned Reviewers</Title>
                                    {!isEditingReviewer ? (
                                        <ActionIcon
                                            variant="subtle"
                                            color="blue"
                                            onClick={() => setIsEditingReviewer(true)}
                                            title="Reassign reviewers">
                                            <FontAwesomeIcon icon="pen-to-square" />
                                        </ActionIcon>
                                    ) : (
                                        <ActionIcon
                                            variant="subtle"
                                            color="danger"
                                            onClick={handleCancelEdit}
                                            title="Done editing">
                                            <FontAwesomeIcon icon="xmark" />
                                        </ActionIcon>
                                    )}
                                </Group>
                            )}

                            {/* Editing reviewer section */}
                            {isEditingReviewer ? (
                                <Stack gap="md">
                                    <Group gap="md">
                                        {tournament.assignedReviewers.map((reviewer) => (
                                            <UserCard static key={reviewer._id} user={reviewer} onSelect={() => {}} />
                                        ))}
                                    </Group>

                                    <Stack gap="xs">
                                        <Group>
                                            <Select
                                                label="Reviewer 1"
                                                key={tournament.assignedReviewers[0]._id}
                                                placeholder="Select new reviewer"
                                                data={getCommitteeOptions()}
                                                value={reviewer1}
                                                onChange={(value) => setReviewer1(value || "")}
                                                allowDeselect={false}
                                            />
                                            <ActionIcon
                                                variant="subtle"
                                                color="success"
                                                onClick={() =>
                                                    handleReassignReviewer(
                                                        tournament.assignedReviewers![0]._id,
                                                        reviewer1,
                                                        true
                                                    )
                                                }
                                                disabled={!reviewer1}
                                                loading={reassignReviewerMutation.isPending}
                                                title="Replace first reviewer"
                                                mt={24}>
                                                <FontAwesomeIcon icon="save" />
                                            </ActionIcon>
                                        </Group>

                                        <Group>
                                            <Select
                                                label="Reviewer 2"
                                                key={tournament.assignedReviewers[1]._id}
                                                placeholder="Select new reviewer"
                                                data={getCommitteeOptions()}
                                                value={reviewer2}
                                                onChange={(value) => setReviewer2(value || "")}
                                                allowDeselect={false}
                                            />
                                            <ActionIcon
                                                variant="subtle"
                                                color="success"
                                                onClick={() =>
                                                    handleReassignReviewer(
                                                        tournament.assignedReviewers![1]._id,
                                                        reviewer2,
                                                        false
                                                    )
                                                }
                                                disabled={!reviewer2}
                                                loading={reassignReviewerMutation.isPending}
                                                title="Replace second reviewer"
                                                mt={24}>
                                                <FontAwesomeIcon icon="save" />
                                            </ActionIcon>
                                        </Group>
                                    </Stack>
                                </Stack>
                            ) : (
                                <Group gap="md">
                                    {/* Reviewer Display */}
                                    {tournament.assignedReviewers.map((reviewer) => (
                                        <UserCard static key={reviewer._id} user={reviewer} onSelect={() => {}} />
                                    ))}
                                </Group>
                            )}

                            {tournament.reviews?.length > 0 && (
                                <>
                                    <Divider my="sm" />
                                    <Title order={4}>Reviews</Title>
                                    <Stack gap="md">
                                        {tournament.reviews.map((review) => (
                                            <TournamentReviewCard
                                                key={review._id}
                                                tournament={tournament}
                                                review={review}
                                            />
                                        ))}
                                    </Stack>
                                </>
                            )}

                            {/* Review input section */}
                            {isUserAssignedReviewer && tournament.isActive && (
                                <>
                                    <Divider my="sm" />
                                    <Title order={4}>Review Input</Title>
                                    <TournamentReviewInput tournament={tournament} />
                                </>
                            )}
                        </Stack>
                    ) : user?.isCommittee && tournament.status === "reviewOngoing" ? (
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
                                    <TournamentReviewCard key={review._id} tournament={tournament} review={review} />
                                ))}
                            </Stack>
                        </>
                    )}
                </Stack>
            </Stack>
        </Card>
    );
}
