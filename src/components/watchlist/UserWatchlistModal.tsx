import { Modal, Stack, Skeleton, Divider, Button, SimpleGrid } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { useAtom } from "jotai";
import { useCallback, useEffect, useState } from "react";
import { selectedUserAtom } from "../../store/atoms";
import { useUser, useRelatedReportsAndVotings } from "../../hooks/useUsers";
import UserCard from "../common/UserCard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import InfringementCreateModal from "./InfringementCreateModal";
import UserInfringementsList from "./UserInfringementsList";
import ReportsMiniSection from "../common/ReportsMiniSection";
import VotingsMiniSection from "../common/VotingsMiniSection";

interface IProps {
    userId: string | null;
    onClose: () => void;
}

export default function UserWatchlistModal({ userId, onClose }: IProps) {
    const [selectedUser, setSelectedUser] = useAtom(selectedUserAtom);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // If we already have a user in the atom, check if it matches userId
    const selectedUserMatches = userId && selectedUser && selectedUser.osuId.toString() === userId;

    // Only fetch if userId is present AND the selected user doesn't match
    const shouldFetch = Boolean(userId && !selectedUserMatches);

    const { data: fetchedUser, isLoading } = useUser(userId, {
        enabled: shouldFetch,
        retry: false,
    });

    const { data: relatedReportsAndVotings, isLoading: isLoadingRelatedReportsAndVotings } =
        useRelatedReportsAndVotings(userId ?? "");

    const [opened, { open, close }] = useDisclosure(false);

    const handleClose = useCallback(() => {
        onClose();
        close();
        // Note: We'll clear the atom after a delay to prevent conflicts with UserDetailsModal
        setTimeout(() => setSelectedUser(null), 100);
    }, [close, onClose, setSelectedUser]);

    const handleCreateModalClose = () => {
        setIsCreateModalOpen(false);
    };

    // Open or close modal immediately if userId changes
    useEffect(() => {
        if (userId) {
            open();
        } else {
            close();
        }
    }, [userId, open, close]);

    // After data loads, handle error/success
    useEffect(() => {
        if (userId && !isLoading) {
            if (shouldFetch) {
                // We performed a fetch
                if (!fetchedUser || fetchedUser.error) {
                    notifications.show({
                        title: "Error",
                        message: "User not found",
                        color: "red",
                    });
                    handleClose();
                } else {
                    setSelectedUser(fetchedUser);
                }
            } else {
                // Skipped fetch because selectedUser is already set
                // but if for some reason the atom is missing or invalid, show error
                if (!selectedUserMatches) {
                    notifications.show({
                        title: "Error",
                        message: "User not found",
                        color: "red",
                    });
                    handleClose();
                }
            }
        }
    }, [userId, isLoading, fetchedUser, shouldFetch, selectedUserMatches, handleClose, setSelectedUser]);

    const LoadingState = () => (
        <Stack>
            <Skeleton height={78} radius="md" mb="md" />
            <Skeleton height={50} radius="sm" mb="md" />
            <Skeleton height={28} width={120} mb="xs" />
            <Skeleton height={100} radius="sm" mb="md" />
            <Skeleton height={100} radius="sm" mb="md" />
            <Skeleton height={100} radius="sm" />
        </Stack>
    );

    return (
        <>
            <Modal opened={opened} onClose={handleClose} title="User Watchlist" size="xl">
                {isLoading ? (
                    <LoadingState />
                ) : selectedUser ? (
                    <Stack gap="md">
                        <UserCard user={selectedUser} static fullWidth />

                        <Button
                            onClick={() => setIsCreateModalOpen(true)}
                            leftSection={<FontAwesomeIcon icon="plus" />}
                            variant="filled"
                            color="primary"
                            fullWidth>
                            Add Infringement
                        </Button>

                        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" verticalSpacing="lg" mt="xs">
                            {isLoadingRelatedReportsAndVotings ? (
                                <>
                                    <Skeleton height={46} radius="sm" />
                                    <Skeleton height={46} radius="sm" />
                                </>
                            ) : (
                                <>
                                    <ReportsMiniSection reports={relatedReportsAndVotings?.reports} hideTooltip />
                                    <VotingsMiniSection votings={relatedReportsAndVotings?.votings} hideTooltip />
                                </>
                            )}
                        </SimpleGrid>

                        <Divider />

                        <UserInfringementsList user={selectedUser} />
                    </Stack>
                ) : null}
            </Modal>

            <InfringementCreateModal
                opened={isCreateModalOpen}
                onClose={handleCreateModalClose}
                preselectedUser={selectedUser}
            />
        </>
    );
}
