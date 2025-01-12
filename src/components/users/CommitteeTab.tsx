import { Stack, Card, Group, Skeleton } from "@mantine/core";
import { useCommitteeUsers } from "../../hooks/useUsers";
import UserDisplay from "../common/UserDisplay";
import { useSetAtom } from "jotai";
import { selectedUserAtom } from "../../store/atoms";
import { IUser } from "../../../interfaces/User";

interface IProps {
    active: boolean;
    onSelect: (userId: string) => void;
}

export default function CommitteeTab({ active, onSelect }: IProps) {
    const { data: users = [], isLoading } = useCommitteeUsers({
        enabled: active,
    });
    const setSelectedUser = useSetAtom(selectedUserAtom);

    const handleUserSelect = (user: IUser) => {
        setSelectedUser(user);
        onSelect(user.osuId.toString());
    };

    const LoadingState = () => (
        <Stack gap="md">
            {[...Array(3)].map((_, i) => (
                <Card key={i} shadow="sm" p="md">
                    <Group>
                        <Skeleton radius="md" height={40} width={40} />
                        <Stack gap={8}>
                            <Skeleton height={18} width={120} />
                            <Skeleton radius="xl" height={20} width={37} />
                        </Stack>
                    </Group>
                </Card>
            ))}
        </Stack>
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
                        onClick={() => handleUserSelect(user)}>
                        <UserDisplay user={user} />
                    </Card>
                ))
            )}
        </Stack>
    );
}
