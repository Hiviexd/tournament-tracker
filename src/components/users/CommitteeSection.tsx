import { SimpleGrid, Card, Stack, Skeleton, Group, Title, Divider } from "@mantine/core";
import { useCommitteeUsers } from "../../hooks/useUsers";
import { IUser } from "../../../interfaces/User";
import UserCard from "../common/UserCard";

interface IProps {
    onSelect: (user: IUser) => void;
    showBadges?: boolean;
}

interface ISectionProps {
    title: string;
    users: IUser[];
}

export default function CommitteeSection({ onSelect, showBadges = false }: IProps) {
    const { data: users = [], isLoading } = useCommitteeUsers({
        includeAlumni: true,
    });

    const LoadingState = () => (
        <Stack gap="xl">
            {[...Array(3)].map((_, sectionIndex) => (
                <Card key={sectionIndex} shadow="sm" p="md">
                    <Stack gap="md">
                        <Skeleton height={28} width={200} />
                        <Divider />
                        <SimpleGrid cols={{ base: 1, xs: 1, sm: 2, md: 3, lg: 4 }} spacing="md">
                            {[...Array(4)].map((_, cardIndex) => (
                                <Card key={cardIndex} bg="primary.10" shadow="sm" p="md" style={{ minWidth: 240 }}>
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
                    </Stack>
                </Card>
            ))}
        </Stack>
    );

    const UserGrid = ({ users }: { users: IUser[] }) => (
        <SimpleGrid cols={{ base: 1, xs: 1, sm: 2, md: 3, lg: 4 }} spacing="md">
            {users.map((user) => (
                <UserCard key={user._id} user={user} onSelect={onSelect} showBadges={showBadges} />
            ))}
        </SimpleGrid>
    );

    const CommitteeSection = ({ title, users }: ISectionProps) => {
        if (users.length === 0) return null;

        const sortedUsers = [...users].sort((a, b) => a.username.toLowerCase().localeCompare(b.username.toLowerCase()));

        return (
            <Card shadow="sm" p="md">
                <Stack gap="md">
                    <Title order={3}>{title}</Title>
                    <Divider />
                    <UserGrid users={sortedUsers} />
                </Stack>
            </Card>
        );
    };

    if (isLoading) return <LoadingState />;

    if (!Array.isArray(users)) return;

    const tcUsers = users.filter((user) => user.isTournamentCommittee);
    const ccUsers = users.filter((user) => user.isContestCommittee);
    const almUsers = users.filter((user) => user.isAlumni);

    return (
        <Stack gap="md">
            <CommitteeSection title="Tournament Committee" users={tcUsers} />
            <CommitteeSection title="Contest Committee" users={ccUsers} />
            <CommitteeSection title="Alumni" users={almUsers} />
        </Stack>
    );
}
