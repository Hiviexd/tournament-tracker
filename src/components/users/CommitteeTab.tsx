import { Stack, Card, Text } from "@mantine/core";
import { IUser } from "../../../interfaces/User";
import UserDisplay from "../common/UserDisplay";

interface IProps {
    users: IUser[];
    isLoading: boolean;
    onUserSelect: (user: IUser) => void;
}

export default function CommitteeTab({ users, isLoading, onUserSelect }: IProps) {
    // TODO use skeletons
    const LoadingState = () => (
        <Card shadow="sm" p="md">
            <Text c="dimmed">Loading...</Text>
        </Card>
    );

    return (
        <Stack gap="md" mt="md">
            {isLoading ? (
                <LoadingState />
            ) : (
                users.map((user) => (
                    <Card
                        key={user._id}
                        shadow="sm"
                        p="md"
                        style={{ cursor: "pointer" }}
                        onClick={() => onUserSelect(user)}>
                        <UserDisplay user={user} />
                    </Card>
                ))
            )}
        </Stack>
    );
}
