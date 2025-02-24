import { Modal, Stack, Skeleton, Divider } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { useAtom } from "jotai";
import { useCallback, useEffect } from "react";
import { loggedInUserAtom, selectedUserAtom } from "../../store/atoms";
import { useUser } from "../../hooks/useUsers";
import UserCard from "../common/UserCard";
import UserHistory from "./details/UserHistory";
import UserGroupMoves from "./details/UserGroupMoves";
import BadgeTracker from "./details/BadgeTracker";
import UserStatus from "./details/UserStatus";

interface IProps {
    userId: string | null;
    onClose: () => void;
}

export default function UserDetailsModal({ userId, onClose }: IProps) {
    const [loggedInUser] = useAtom(loggedInUserAtom);

    const [selectedUser, setSelectedUser] = useAtom(selectedUserAtom);

    // If we already have a user in the atom, check if it matches userId
    const selectedUserMatches = userId && selectedUser && selectedUser.osuId.toString() === userId;

    // Only fetch if userId is present AND the selected user doesn't match
    const shouldFetch = Boolean(userId && !selectedUserMatches);

    const { data: fetchedUser, isLoading } = useUser(userId, {
        enabled: shouldFetch,
        retry: false,
    });

    const [opened, { open, close }] = useDisclosure(false);

    const handleClose = useCallback(() => {
        onClose();
        close();
        setSelectedUser(null);
    }, [close, onClose, setSelectedUser]);

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
            <Skeleton height={240} radius="md" mb="md" />
            <Skeleton height={28} width={120} mb="xs" />
            <Skeleton height={100} radius="sm" mb="md" />
            <Skeleton height={28} width={140} mb="xs" />
            <Skeleton height={120} radius="sm" />
        </Stack>
    );

    return (
        <Modal opened={opened} onClose={handleClose} title="User Details" size="lg">
            {isLoading ? (
                <LoadingState />
            ) : selectedUser ? (
                <Stack gap="md">
                    <UserCard user={selectedUser} onSelect={() => {}} static />

                    <UserStatus user={selectedUser} />
                    <Divider />
                    <UserHistory history={selectedUser.history} />
                    <Divider />
                    <BadgeTracker user={selectedUser} />

                    {loggedInUser!.isAdmin && (
                        <Stack gap="xs">
                            <Divider />
                            <UserGroupMoves user={selectedUser} />
                        </Stack>
                    )}
                </Stack>
            ) : null}
        </Modal>
    );
}
