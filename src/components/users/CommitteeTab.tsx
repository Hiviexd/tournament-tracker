import { SimpleGrid, Card, Stack, Skeleton, Group } from "@mantine/core";
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
        <SimpleGrid cols={{ base: 1, xs: 1, sm: 2, md: 3, lg: 4 }} spacing="md">
            {[...Array(8)].map((_, i) => (
                <Card key={i} shadow="sm" p="md" style={{ minWidth: 240 }}>
                    <Group>
                        <Skeleton radius="md" height={40} width={40} />
                        <Stack gap={8}>
                            <Skeleton height={18} width={120} />
                            <Skeleton radius="xl" height={20} width={37} />
                        </Stack>
                    </Group>
                </Card>
            ))}
        </SimpleGrid>
    );

    return (
        <Stack gap="md" mt="md">
            {isLoading ? (
                <LoadingState />
            ) : (
                <SimpleGrid cols={{ base: 1, xs: 1, sm: 2, md: 3, lg: 4 }} spacing="md">
                    {users.map((user) => (
                        <Card
                            key={user._id}
                            shadow="sm"
                            p="md"
                            className="user-card"
                            style={{ minWidth: 240 }}
                            onClick={() => handleUserSelect(user)}>
                            <div
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    backgroundImage: `url(${user.coverUrl})`,
                                    backgroundSize: "cover",
                                    backgroundPosition: "center",
                                    filter: "brightness(0.4)",
                                    zIndex: 0,
                                }}
                            />
                            <div
                                className="user-card-content">
                                <UserDisplay user={user} />
                            </div>
                        </Card>
                    ))}
                </SimpleGrid>
            )}
        </Stack>
    );
}
