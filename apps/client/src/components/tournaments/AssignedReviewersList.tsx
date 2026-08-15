import { Group, List, Stack, Menu, ActionIcon, Divider, Collapse } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import UserCard from "../common/UserCard";
import UserLink from "../common/UserLink";
import { ITournament } from "@tc/types/Tournament";
import { IUser } from "@tc/types/User";
import { useReassignReviewer, useRemoveReviewer } from "../../hooks/useTournaments";
import { useConfirmModal } from "../../hooks/useModals";
import { useDisclosure } from "@mantine/hooks";
import { useState } from "react";
import ReviewerReassignModal from "./ReviewerReassignModal";
import AddReviewersForm from "./AddReviewersForm";
import utils from "@tc/utils/client";

interface IProps {
    tournament: ITournament;
    committeeUsers: IUser[] | undefined;
    currentUserId?: string;
    /** When true, committee can see edit/delete menu (only when isEditing). */
    canEdit?: boolean;
    /** When true, show edit UI (menu per card) and parent may show AddReviewersForm. */
    isEditing?: boolean;
    /** Pass through to UserCard fullWidth (e.g. for mobile). */
    fullWidthCards?: boolean;
}

export default function AssignedReviewersList({
    tournament,
    committeeUsers,
    currentUserId,
    canEdit = false,
    isEditing = false,
    fullWidthCards = false,
}: IProps) {
    const [reassignModalOpened, { open: openReassignModal, close: closeReassignModal }] = useDisclosure(false);
    const [reviewerToReassign, setReviewerToReassign] = useState<IUser | null>(null);
    const reassignMutation = useReassignReviewer(tournament.id);
    const removeMutation = useRemoveReviewer(tournament.id);
    const confirmModal = useConfirmModal();

    const currentReviewerIds = tournament.assignedReviewers?.map((r) => r.id) || [];
    const options = utils.getReviewerCommitteeOptions(tournament, committeeUsers, currentReviewerIds, currentUserId);

    const handleOpenReassign = (reviewer: IUser) => {
        setReviewerToReassign(reviewer);
        openReassignModal();
    };

    const handleCloseReassign = () => {
        closeReassignModal();
        setReviewerToReassign(null);
    };

    const handleDelete = async (reviewer: IUser) => {
        const confirmed = await confirmModal({
            preset: "delete",
            title: "Remove reviewer?",
            text: `Are you sure you want to remove ${reviewer.username} from the reviewer list?`,
            confirmText: "Remove",
        });
        if (confirmed) {
            await removeMutation.mutateAsync(reviewer.id);
        }
    };

    const handleReassignSubmit = async (newReviewerId: string) => {
        if (!reviewerToReassign) return;
        await reassignMutation.mutateAsync({ oldReviewerId: reviewerToReassign.id, newReviewerId });
        handleCloseReassign();
    };

    if (!tournament.assignedReviewers?.length) return null;

    const showEditList = canEdit && isEditing;

    return (
        <>
            <Stack gap="md">
                <Group gap="md" align="flex-start">
                    {tournament.assignedReviewers.map((reviewer) => (
                        <UserCard key={reviewer.id} static showBadges user={reviewer} fullWidth={fullWidthCards} />
                    ))}
                </Group>

                <Collapse expanded={showEditList}>
                    <Stack gap="md">
                        <Divider />
                        <List spacing={6} listStyleType="disc" size="sm">
                            {tournament.assignedReviewers.map((reviewer) => (
                                <List.Item key={reviewer.id}>
                                    <Group gap="xs" wrap="nowrap" align="center">
                                        <UserLink user={reviewer} size="sm" />
                                        <Menu position="right-start" withArrow>
                                            <Menu.Target>
                                                <ActionIcon size="sm" variant="subtle" color="gray">
                                                    <FontAwesomeIcon icon="ellipsis-vertical" />
                                                </ActionIcon>
                                            </Menu.Target>
                                            <Menu.Dropdown>
                                                <Menu.Item
                                                    leftSection={<FontAwesomeIcon icon="user-pen" />}
                                                    onClick={() => handleOpenReassign(reviewer)}>
                                                    Reassign
                                                </Menu.Item>
                                                <Menu.Item
                                                    leftSection={<FontAwesomeIcon icon="user-minus" />}
                                                    color="danger"
                                                    onClick={() => handleDelete(reviewer)}>
                                                    Remove
                                                </Menu.Item>
                                            </Menu.Dropdown>
                                        </Menu>
                                    </Group>
                                </List.Item>
                            ))}
                        </List>
                        <AddReviewersForm
                            tournament={tournament}
                            committeeUsers={committeeUsers}
                            currentUserId={currentUserId}
                        />
                    </Stack>
                </Collapse>
            </Stack>

            <ReviewerReassignModal
                opened={reassignModalOpened}
                onClose={handleCloseReassign}
                options={options}
                onSubmit={handleReassignSubmit}
                loading={reassignMutation.isPending}
            />
        </>
    );
}
