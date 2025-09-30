import { Stack, Title, SimpleGrid, Card, Group, Badge } from "@mantine/core";
import { IUser } from "../../../interfaces/User";
import EmptyState from "../common/EmptyState";
import InfringementCard from "../watchlist/InfringementCard";
import UserDisplay from "../common/UserDisplay";

interface IProps {
    users: IUser[];
}

export default function DashboardInfringementsSection({ users }: IProps) {
    const totalInfringementsCount = users.reduce((acc, user) => acc + user.infringements.length, 0);

    return (
        <Stack gap="md">
            <Title order={3} className="header-border-left">
                Infringements
            </Title>

            <Group align="center" gap="xs">
                <Title order={4} c="orange">
                    Needs Email
                </Title>
                <Badge color="orange" variant="light">
                    {totalInfringementsCount}
                </Badge>
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                {users.length > 0 &&
                    users.map((user) => (
                        <Card key={user.id} shadow="sm" p="lg">
                            <Stack gap="sm">
                                <UserDisplay user={user} />
                                {user.infringements.length > 0 &&
                                    user.infringements.map((infringement) => (
                                        <InfringementCard
                                            key={infringement.id}
                                            infringement={infringement}
                                            userToNavigateTo={user.osuId}
                                        />
                                    ))}
                            </Stack>
                        </Card>
                    ))}
            </SimpleGrid>

            {users.length === 0 && (
                <EmptyState
                    height={100}
                    icon="user-shield"
                    title={`All infringements are clear!`}
                    description="some placeholder text change this later"
                />
            )}
        </Stack>
    );
}
