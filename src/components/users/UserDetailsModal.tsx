import { Modal, Stack, Group, Skeleton } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useUser } from "../../hooks/useUsers";
import UserDisplay from "../common/UserDisplay";
import { useEffect, useCallback } from "react";
import { notifications } from "@mantine/notifications";

interface IProps {
    userId: string | null;
    onClose: () => void;
}

export default function UserDetailsModal({ userId, onClose }: IProps) {
    const { data: user, isLoading } = useUser(userId);
    const [opened, { open, close }] = useDisclosure(false);

    const handleClose = useCallback(() => {
        onClose();
        close();
    }, [close, onClose]);

    useEffect(() => {
        if (userId && !isLoading) {
            if (!user || user.error) {
                notifications.show({
                    title: "Error",
                    message: "User not found",
                    color: "red",
                });
                handleClose();
            } else {
                open();
            }
        }
    }, [userId, user, isLoading, open, handleClose]);

    const LoadingState = () => (
        <Stack>
            <Group>
                <Skeleton circle height={40} />
                <Stack gap={8}>
                    <Skeleton height={20} width={120} />
                    <Skeleton height={16} width={80} />
                </Stack>
            </Group>
        </Stack>
    );

    return (
        <Modal opened={opened} onClose={handleClose} title="User Details" size="lg">
            {isLoading ? (
                <LoadingState />
            ) : (
                user && (
                    <Stack>
                        <UserDisplay user={user} />
                        {/* Add more user details and management options here */}
                    </Stack>
                )
            )}
        </Modal>
    );
}
