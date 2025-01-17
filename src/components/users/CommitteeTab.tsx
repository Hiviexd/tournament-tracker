import { SimpleGrid, Card, Stack, Skeleton, Group, Title, Divider } from "@mantine/core";
import { useCommitteeUsers } from "../../hooks/useUsers";
import { useSetAtom } from "jotai";
import { selectedUserAtom } from "../../store/atoms";
import { IUser } from "../../../interfaces/User";
import UserCard from "../common/UserCard";

interface IProps {
    active: boolean;
    onSelect: (userId: string) => void;
}

interface ISectionProps {
    title: string;
    users: IUser[];
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

    const UserGrid = ({ users }: { users: IUser[] }) => (
        <SimpleGrid cols={{ base: 1, xs: 1, sm: 2, md: 3, lg: 4 }} spacing="md">
            {users.map((user) => (
                <UserCard key={user._id} user={user} onSelect={handleUserSelect} />
            ))}
        </SimpleGrid>
    );

    const CommitteeSection = ({ title, users }: ISectionProps) => {
        if (users.length === 0) return null;

        return (
            <Card shadow="sm" p="md">
                <Stack gap="md">
                    <Title order={3}>{title}</Title>
                    <Divider />
                    <UserGrid users={users} />
                </Stack>
            </Card>
        );
    };

    if (isLoading) return <LoadingState />;

    const tcUsers = users.filter((user) => user.isTournamentCommittee);
    const ccUsers = users.filter((user) => user.isContestCommittee);
    const almUsers = users.filter((user) => user.isAlumni);

    return (
        <Stack gap="xl" mt="md">
            <CommitteeSection title="Tournament Committee" users={tcUsers} />
            <CommitteeSection title="Contest Committee" users={ccUsers} />
            <CommitteeSection title="Alumni" users={almUsers} />
        </Stack>
    );
}
