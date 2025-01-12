import { Modal, Stack, Card, Text } from "@mantine/core";
import { IUser } from "../../../interfaces/User";
import UserDisplay from "../common/UserDisplay";

interface IProps {
    opened: boolean;
    onClose: () => void;
    user: IUser | null;
    isLoading: boolean;
}

export default function UserDetailsModal({ opened, onClose, user, isLoading }: IProps) {
    // TODO use skeletons
    const LoadingState = () => (
        <Card shadow="sm" p="md">
            <Text c="dimmed">Loading...</Text>
        </Card>
    );

    return (
        <Modal opened={opened} onClose={onClose} title="User Details" size="lg">
            {isLoading ? (
                <LoadingState />
            ) : user ? (
                <Stack>
                    <UserDisplay user={user} />
                </Stack>
            ) : null}
        </Modal>
    );
}
